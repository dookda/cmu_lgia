"""
Divisions router — mirrors /api/v2/divisions in nodejs/service/apiv2.js

Routes:
  GET    /api/v2/divisions
  POST   /api/v2/divisions
  PUT    /api/v2/divisions/{id}
  DELETE /api/v2/divisions/{id}
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text

from ..database import get_db, AsyncSession
from ..schemas.division import DivisionOut, CreateDivisionRequest, UpdateDivisionRequest

router = APIRouter(prefix="/api/v2/divisions", tags=["divisions"])


@router.get("", response_model=list[DivisionOut])
async def list_divisions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text("SELECT id, division_name, created_at FROM layer_division ORDER BY id ASC")
    )
    return [DivisionOut(**row) for row in result.mappings()]


@router.post("", response_model=DivisionOut, status_code=201)
async def create_division(body: CreateDivisionRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text("INSERT INTO layer_division (division_name) VALUES (:name) RETURNING *"),
        {"name": body.division_name},
    )
    await db.commit()
    row = result.mappings().first()
    if not row:
        raise HTTPException(500, "Insert failed")
    return DivisionOut(**row)


@router.put("/{division_id}")
async def update_division(
    division_id: int,
    body: UpdateDivisionRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        text("UPDATE layer_division SET division_name = :name WHERE id = :id"),
        {"name": body.division_name, "id": division_id},
    )
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(404, "Division not found")
    return {"success": True}


@router.delete("/{division_id}")
async def delete_division(division_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text("DELETE FROM layer_division WHERE id = :id"),
        {"id": division_id},
    )
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(404, "Entry not found")
    return {"success": True}
