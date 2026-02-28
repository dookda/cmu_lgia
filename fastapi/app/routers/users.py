"""
Users router — mirrors /api/v2/users in nodejs/service/apiv2.js

Routes:
  GET    /api/v2/users
  GET    /api/v2/user/{userid}
  POST   /api/v2/users
  PUT    /api/v2/users/{id}
  PUT    /api/v2/profile/{userid}
  DELETE /api/v2/users/{id}
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
import bcrypt as _bcrypt

from ..database import get_db, AsyncSession
from ..schemas.user import (
    UserOut, CreateUserRequest, UpdateUserRequest,
    UpdateProfileRequest,
)

router = APIRouter(prefix="/api/v2", tags=["users"])

def _hash_password(plain: str) -> str:
    return _bcrypt.hashpw(plain.encode(), _bcrypt.gensalt(rounds=10)).decode()


@router.get("/users", response_model=list[UserOut])
async def list_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text("SELECT id, username, displayname, email, ts, auth, division FROM tb_user ORDER BY id ASC")
    )
    return [UserOut(**row) for row in result.mappings()]


@router.get("/user/{userid}")
async def get_user(userid: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text("SELECT * FROM tb_user WHERE userid = :uid"),
        {"uid": userid},
    )
    rows = result.mappings().all()
    return [dict(r) for r in rows]


@router.post("/users", status_code=201)
async def create_user(body: CreateUserRequest, db: AsyncSession = Depends(get_db)):
    hashed = _hash_password(body.password)
    result = await db.execute(
        text("""
            INSERT INTO tb_user (username, email, pass, ts, auth, division)
            VALUES (:u, :e, :p, NOW(), :a, :d)
            RETURNING *
        """),
        {"u": body.username, "e": body.email, "p": hashed, "a": body.auth, "d": body.division},
    )
    await db.commit()
    return {"message": "User registered successfully", "user": dict(result.mappings().first())}


@router.put("/users/{user_id}")
async def update_user(user_id: int, body: UpdateUserRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text("""
            UPDATE tb_user
            SET username = :u, email = :e, auth = :a, division = :d
            WHERE id = :id
            RETURNING id, displayname AS "displayName", username AS "userName",
                      email AS "userEmail", division AS "userDivision"
        """),
        {"u": body.username, "e": body.email, "a": body.auth, "d": body.division, "id": user_id},
    )
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(404, "User not found")
    return {"message": "User updated successfully", "user": dict(result.mappings().first())}


@router.put("/profile/{userid}")
async def update_profile(userid: str, body: UpdateProfileRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text("""
            UPDATE tb_user
            SET displayname = :dn, username = :u, email = :e, division = :d
            WHERE userid = :uid
            RETURNING id, displayname AS "displayName", username AS "userName",
                      email AS "userEmail", division AS "userDivision"
        """),
        {"dn": body.displayName, "u": body.userName, "e": body.userEmail, "d": body.userDivision, "uid": userid},
    )
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(404, "User not found")
    return {"message": "User updated successfully", "user": dict(result.mappings().first())}


@router.delete("/users/{user_id}")
async def delete_user(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text("DELETE FROM tb_user WHERE id = :id RETURNING *"),
        {"id": user_id},
    )
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(404, "User not found")
    return {"message": "User deleted successfully"}
