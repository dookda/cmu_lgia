"""
Auth router — mirrors nodejs/service/authen.js

Routes:
  POST /auth/local/login
  POST /auth/register
  GET  /auth/logout
  GET  /auth/profile/{role}
  GET  /auth/profiledetail
  GET  /auth/login          (LINE OAuth redirect)
  GET  /auth/line/callback  (LINE OAuth callback)
"""

import urllib.parse
import secrets
import bcrypt as _bcrypt
from fastapi import APIRouter, Request, HTTPException, status, Depends
from fastapi.responses import RedirectResponse
import httpx

from ..database import get_db, AsyncSession
from ..config import settings
from ..schemas.auth import (
    LoginRequest, LoginResponse,
    RegisterRequest, RegisterResponse,
    ProfileResponse, UserSession,
)
from ..dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

def _hash_password(plain: str) -> str:
    return _bcrypt.hashpw(plain.encode(), _bcrypt.gensalt(rounds=10)).decode()

def _verify_password(plain: str, hashed: str) -> bool:
    try:
        return _bcrypt.checkpw(plain.encode(), hashed.encode())
    except Exception:
        return False

# ─── Local login ─────────────────────────────────────────────────────────────

@router.post("/local/login", response_model=LoginResponse)
async def local_login(body: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text

    result = await db.execute(
        text("SELECT * FROM tb_user WHERE username = :u AND provider = 'local'"),
        {"u": body.username},
    )
    user = result.mappings().first()

    if not user or not user["pass"] or not _verify_password(body.password, user["pass"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    request.session["user"] = {
        "userId": user["userid"],
        "displayName": user["displayname"],
        "pictureUrl": user["picture_url"],
        "auth": user["auth"],
        "division": user.get("division"),
    }
    return LoginResponse(success=True, message="Logged in successfully")


# ─── Register ────────────────────────────────────────────────────────────────

@router.post("/register", response_model=RegisterResponse)
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text

    # Check duplicate
    dup = await db.execute(
        text("SELECT username, email FROM tb_user WHERE username = :u OR email = :e"),
        {"u": body.username, "e": body.email},
    )
    existing = dup.mappings().first()
    if existing:
        if existing["username"] == body.username and existing["email"] == body.email:
            msg = "Both username and email นี้ถูกใช้แล้ว"
        elif existing["username"] == body.username:
            msg = "Username นี้ถูกใช้แล้ว"
        else:
            msg = "Email นี้ถูกใช้แล้ว"
        raise HTTPException(status_code=400, detail=msg)

    hashed = _hash_password(body.password)
    userid = f"fid_{secrets.token_hex(8)}"

    result = await db.execute(
        text("""
            INSERT INTO tb_user
                (userid, username, displayname, pass, picture_url, email, provider, auth, created_at, updated_at, ts)
            VALUES
                (:uid, :u, :u, :p, './../images/avatar/admin.png', :e, 'local', 'user', NOW(), NOW(), NOW())
            RETURNING *
        """),
        {"uid": userid, "u": body.username, "p": hashed, "e": body.email},
    )
    await db.commit()
    row = result.mappings().first()
    return RegisterResponse(success=True, user=dict(row))


# ─── Logout ──────────────────────────────────────────────────────────────────

@router.get("/logout")
async def logout(request: Request):
    request.session.clear()
    return {"success": True, "message": "Logged out successfully"}


# ─── Profile ─────────────────────────────────────────────────────────────────

@router.get("/profile/{role}", response_model=ProfileResponse)
async def profile(role: str, request: Request):
    user_data = request.session.get("user")
    if not user_data:
        return ProfileResponse(success=False, auth=False)

    user = UserSession(**user_data)

    role_permissions: dict[str, list[str]] = {
        "admin":  ["admin"],
        "editor": ["admin", "editor"],
    }
    allowed = role_permissions.get(role, [])
    is_authorized = user.auth in allowed

    return ProfileResponse(success=True, auth=is_authorized, user=user)


@router.get("/profiledetail")
async def profile_detail(request: Request, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    from sqlalchemy import text

    session_user = request.session["user"]
    result = await db.execute(
        text("""
            SELECT userid AS "userId", displayname AS "displayName",
                   picture_url AS "pictureUrl", auth, division
            FROM tb_user WHERE userid = :uid
        """),
        {"uid": session_user["userId"]},
    )
    row = result.mappings().first()
    if not row:
        raise HTTPException(404, "User not found")
    return {"success": True, "user": dict(row)}


@router.put("/profile")
async def update_profile(body: dict, request: Request, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text
    session_user = request.session.get("user")
    if not session_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    uid = session_user["userId"]
    allowed_fields = {"username", "email", "division"}
    updates = {k: v for k, v in body.items() if k in allowed_fields}
    if not updates:
        raise HTTPException(400, "No valid fields to update")
    set_clause = ", ".join(f"{k} = :{k}" for k in updates)
    updates["uid"] = uid
    await db.execute(text(f"UPDATE tb_user SET {set_clause} WHERE userid = :uid"), updates)
    await db.commit()
    return {"success": True}


# ─── LINE OAuth ───────────────────────────────────────────────────────────────

@router.get("/login")
async def line_login(request: Request):
    state = secrets.token_urlsafe(16)
    request.session["state"] = state

    params = urllib.parse.urlencode({
        "response_type": "code",
        "client_id": settings.LINE_CHANNEL_ID,
        "redirect_uri": settings.LINE_CALLBACK_URL,
        "state": state,
        "scope": "profile openid email",
    })
    return RedirectResponse(f"https://access.line.me/oauth2/v2.1/authorize?{params}")


@router.get("/line/callback")
async def line_callback(code: str, state: str, request: Request, db: AsyncSession = Depends(get_db)):
    from sqlalchemy import text

    if state != request.session.get("state"):
        raise HTTPException(status_code=401, detail="Invalid state parameter")

    async with httpx.AsyncClient() as client:
        # Exchange code for token
        token_res = await client.post(
            "https://api.line.me/oauth2/v2.1/token",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": settings.LINE_CALLBACK_URL,
                "client_id": settings.LINE_CHANNEL_ID,
                "client_secret": settings.LINE_CHANNEL_SECRET,
            },
        )
        if not token_res.is_success:
            raise HTTPException(400, "Token exchange failed")

        access_token = token_res.json()["access_token"]

        # Fetch LINE profile
        profile_res = await client.get(
            "https://api.line.me/v2/profile",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if not profile_res.is_success:
            raise HTTPException(400, "Profile fetch failed")

    user_profile = profile_res.json()

    # Upsert user
    await db.execute(
        text("""
            INSERT INTO tb_user (userid, displayname, picture_url, auth, created_at, updated_at, ts)
            VALUES (:uid, :dn, :pic, 'user', NOW(), NOW(), NOW())
            ON CONFLICT (userid) DO UPDATE
            SET displayname = EXCLUDED.displayname,
                picture_url = EXCLUDED.picture_url,
                updated_at = NOW()
        """),
        {"uid": user_profile["userId"], "dn": user_profile["displayName"], "pic": user_profile.get("pictureUrl")},
    )
    await db.commit()

    # Check user exists with line provider
    result = await db.execute(
        text("SELECT * FROM tb_user WHERE userid = :uid AND provider = 'line'"),
        {"uid": user_profile["userId"]},
    )
    user = result.mappings().first()
    if not user:
        return RedirectResponse("/authen/?error=auth_failed")

    request.session["user"] = {
        "userId": user_profile["userId"],
        "displayName": user_profile["displayName"],
        "pictureUrl": user_profile.get("pictureUrl"),
        "auth": user["auth"],
        "division": user.get("division"),
    }
    return RedirectResponse("/v2/dashboard")
