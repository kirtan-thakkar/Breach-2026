import logging
from typing import Literal, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

from app.core.supabase import get_supabase, get_supabase_admin

router = APIRouter()
logger = logging.getLogger(__name__)


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: Optional[str] = None
    role: Literal["admin", "user"]
    organization_name: Optional[str] = None
    mobile: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserSessionResponse(BaseModel):
    user_id: str
    email: EmailStr
    role: Literal["admin", "user"]
    access_token: str
    refresh_token: str
    expires_at: Optional[int] = None
    organization_id: Optional[str] = None


def _extract_session_payload(auth_response, fallback_role: Optional[str] = None, org_id: Optional[str] = None):
    session = getattr(auth_response, "session", None)
    user = getattr(auth_response, "user", None)

    if not session or not user:
        return None

    user_metadata = getattr(user, "user_metadata", {}) or {}
    app_metadata = getattr(user, "app_metadata", {}) or {}

    role = user_metadata.get("role") or app_metadata.get("role") or fallback_role

    if role not in {"admin", "user"}:
        role = "user"

    return UserSessionResponse(
        user_id=str(getattr(user, "id")),
        email=getattr(user, "email"),
        role=role,
        access_token=getattr(session, "access_token"),
        refresh_token=getattr(session, "refresh_token"),
        expires_at=getattr(session, "expires_at", None),
        organization_id=org_id,
    )


@router.post("/signup", response_model=UserSessionResponse)
async def signup(payload: SignupRequest):
    admin = get_supabase_admin()
    
    try:
        auth_user_resp = admin.auth.admin.create_user(
            {
                "email": payload.email,
                "password": payload.password,
                "email_confirm": True,
                "user_metadata": {
                    "full_name": payload.full_name,
                    "role": payload.role,
                },
            }
        )
        new_user = auth_user_resp.user
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create auth user: {error}",
        )

    org_id = None
    org_name = payload.organization_name or "Default"
    
    try:
        org_resp = admin.table("organizations").select("*").eq("name", org_name).execute()
        if org_resp.data:
            org_id = org_resp.data[0]["id"]
        else:
            new_org = admin.table("organizations").insert({"name": org_name}).execute()
            if new_org.data:
                org_id = new_org.data[0]["id"]
    except Exception as error:
        logger.warning(f"Org resolution failed: {error}")
        try:
            org_resp = admin.table("organizations").select("id").eq("name", "Default").execute()
            if org_resp.data:
                org_id = org_resp.data[0]["id"]
            else:
                new_org = admin.table("organizations").insert({"name": "Default"}).execute()
                if new_org.data:
                    org_id = new_org.data[0]["id"]
        except Exception:
            pass

    try:
        user_data = {
            "id": str(new_user.id),
            "organization_id": org_id,
            "email": payload.email,
            "name": payload.full_name,
            "role": payload.role,
        }
        admin.table("users").insert(user_data).execute()
    except Exception as error:
        logger.warning(f"User table sync failed: {error}")

    # Embed org_id into JWT user_metadata so login can read it without touching the users table.
    if org_id:
        try:
            admin.auth.admin.update_user_by_id(
                str(new_user.id),
                {
                    "user_metadata": {
                        "full_name": payload.full_name,
                        "role": payload.role,
                        "organization_id": str(org_id),
                    }
                },
            )
        except Exception as error:
            logger.warning(f"User metadata org embed failed: {error}")

    if payload.role == "user" and org_id:
        try:
            target_data = {
                "organization_id": org_id,
                "email": payload.email,
                "name": payload.full_name,
                "department": "Employees",
            }
            if payload.mobile:
                target_data["whatsapp_number"] = payload.mobile
            admin.table("targets").upsert(target_data, on_conflict="organization_id,email").execute()
        except Exception as error:
            logger.warning(f"Target sync failed: {error}")

    client = get_supabase()
    try:
        auth_response = client.auth.sign_in_with_password(
            {"email": payload.email, "password": payload.password}
        )
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"User created but sign-in failed: {error}",
        )

    session_payload = _extract_session_payload(auth_response, fallback_role=payload.role, org_id=str(org_id) if org_id else None)

    if not session_payload:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to establish Supabase session",
        )

    return session_payload


@router.post("/login", response_model=UserSessionResponse)
async def login(payload: LoginRequest):
    client = get_supabase()
    admin = get_supabase_admin()

    try:
        auth_response = client.auth.sign_in_with_password(
            {"email": payload.email, "password": payload.password}
        )
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid credentials: {error}",
        )

    org_id = None
    user = getattr(auth_response, "user", None)
    if user:
        # 1. Read from JWT metadata first — no DB call needed.
        user_metadata = getattr(user, "user_metadata", {}) or {}
        org_id = user_metadata.get("organization_id")

        # 2. Fall back to admin users table if not in metadata.
        if not org_id:
            try:
                db_user = admin.table("users").select("organization_id").eq("id", str(user.id)).limit(1).execute()
                if db_user.data:
                    org_id = db_user.data[0].get("organization_id")
            except Exception as error:
                logger.warning(f"Organization lookup during login failed for user {user.id}: {error}")

        # 3. Fall back to any existing organization (admin client bypasses RLS).
        if not org_id:
            try:
                org_res = admin.table("organizations").select("id").limit(1).execute()
                if org_res.data:
                    org_id = org_res.data[0].get("id")
                    # Back-fill metadata so next login is instant.
                    try:
                        admin.auth.admin.update_user_by_id(
                            str(user.id),
                            {"user_metadata": {**user_metadata, "organization_id": str(org_id)}},
                        )
                    except Exception:
                        pass
            except Exception as error:
                logger.warning(f"Fallback org lookup during login failed for user {user.id}: {error}")

    session_payload = _extract_session_payload(auth_response, org_id=str(org_id) if org_id else None)

    if not session_payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    return session_payload
