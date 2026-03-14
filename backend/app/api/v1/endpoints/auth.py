from typing import Literal, Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

from app.core.supabase import get_supabase, get_supabase_admin

router = APIRouter()


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: Optional[str] = None
    role: Literal["advisor", "user"]


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserSessionResponse(BaseModel):
    user_id: str
    email: EmailStr
    role: Literal["advisor", "user"]
    access_token: str
    refresh_token: str
    expires_at: Optional[int] = None


def _extract_session_payload(auth_response, fallback_role: Optional[str] = None):
    session = getattr(auth_response, "session", None)
    user = getattr(auth_response, "user", None)

    if not session or not user:
        return None

    user_metadata = getattr(user, "user_metadata", {}) or {}
    app_metadata = getattr(user, "app_metadata", {}) or {}

    role = user_metadata.get("role") or app_metadata.get("role") or fallback_role

    if role not in {"advisor", "user"}:
        role = "user"

    return UserSessionResponse(
        user_id=str(getattr(user, "id")),
        email=getattr(user, "email"),
        role=role,
        access_token=getattr(session, "access_token"),
        refresh_token=getattr(session, "refresh_token"),
        expires_at=getattr(session, "expires_at", None),
    )


@router.post("/signup", response_model=UserSessionResponse)
async def signup(payload: SignupRequest):
    admin = get_supabase_admin()

    try:
        admin.auth.admin.create_user(
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
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create user: {error}",
        )

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

    session_payload = _extract_session_payload(auth_response, fallback_role=payload.role)

    if not session_payload:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to establish Supabase session",
        )

    return session_payload


@router.post("/login", response_model=UserSessionResponse)
async def login(payload: LoginRequest):
    client = get_supabase()

    try:
        auth_response = client.auth.sign_in_with_password(
            {"email": payload.email, "password": payload.password}
        )
    except Exception as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid credentials: {error}",
        )

    session_payload = _extract_session_payload(auth_response)

    if not session_payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    return session_payload
