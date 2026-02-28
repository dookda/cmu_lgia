"""
Info router — mirrors /api/v2/info in nodejs/service/apiv2.js

Routes:
  GET  /api/v2/info
  GET  /api/v2/info/{id}
  POST /api/v2/info
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text

from ..database import get_db, AsyncSession
from ..schemas.user import InfoOut, UpdateInfoRequest

router = APIRouter(prefix="/api/v2/info", tags=["info"])


@router.get("", response_model=InfoOut | None)
async def get_info(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT * FROM tb_info LIMIT 1"))
    row = result.mappings().first()
    return InfoOut(**row) if row else None


@router.get("/{info_id}", response_model=InfoOut)
async def get_info_by_id(info_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text("SELECT * FROM tb_info WHERE id = :id"),
        {"id": info_id},
    )
    row = result.mappings().first()
    if not row:
        raise HTTPException(404, "Record not found")
    return InfoOut(**row)


@router.post("", response_model=InfoOut)
async def update_info(body: UpdateInfoRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text("""
            UPDATE tb_info
            SET name = :name, img = COALESCE(:img, img)
            WHERE id = 1
            RETURNING *
        """),
        {"name": body.name, "img": body.img},
    )
    await db.commit()
    row = result.mappings().first()
    if not row:
        raise HTTPException(404, "Info record not found")
    return InfoOut(**row)
