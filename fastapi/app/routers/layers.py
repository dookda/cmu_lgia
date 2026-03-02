"""
Layers router — mirrors all /api/v2/layer_* and feature endpoints in apiv2.js

Routes:
  GET    /api/v2/layer_names
  GET    /api/v2/layer_names/{formid}
  DELETE /api/v2/layer_names/{gid}
  POST   /api/v2/create_table
  GET    /api/v2/load_layer/{formid}
  POST   /api/v2/load_layer
  GET    /api/v2/load_layer/{formid}/{refid}
  GET    /api/v2/load_layer_description/{formid}
  GET    /api/v2/load_feature_style/{formid}/{refid}
  POST   /api/v2/insert_row
  DELETE /api/v2/delete_row
  PUT    /api/v2/update_row/{formid}/{refid}
  POST   /api/v2/update_layer
  PUT    /api/v2/update_feature
  PUT    /api/v2/update_feature_style
  DELETE /api/v2/delete_feature
  POST   /api/v2/create_column/{formid}
  PUT    /api/v2/update_column/{formid}/{refid}
  DELETE /api/v2/delete_column/{formid}/{colid}
"""

import re
import time
import secrets
import io
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy import text

from ..database import get_db, AsyncSession
from ..schemas.layer import (
    LayerOut, CreateLayerRequest, CreateLayerResponse,
    LoadLayerResponse, UpdateLayerRequest, InsertRowRequest,
    DeleteRowRequest, UpdateFeatureRequest, DeleteFeatureRequest,
    UpdateFeatureStyleRequest, CreateColumnRequest,
)

router = APIRouter(prefix="/api/v2", tags=["layers"])

_VALID_ID = re.compile(r"^[a-zA-Z_][a-zA-Z0-9_]*$")
_VALID_ANY = re.compile(r"^[a-zA-Z0-9_]+$")

PG_TYPE_MAP = {"text": "TEXT", "numeric": "NUMERIC", "date": "DATE", "file": "TEXT", "integer": "INTEGER", "boolean": "BOOLEAN"}


def _assert_safe(name: str) -> str:
    if not _VALID_ANY.match(name):
        raise HTTPException(400, f"Invalid identifier: {name}")
    return name


# ─── Layer names ─────────────────────────────────────────────────────────────

@router.get("/layer_names", response_model=list[LayerOut])
async def list_layer_names(db: AsyncSession = Depends(get_db)):
    result = await db.execute(text("SELECT * FROM layer_name"))
    return [LayerOut(**row) for row in result.mappings()]


@router.get("/layer_names/{formid}", response_model=list[LayerOut])
async def get_layer_by_formid(formid: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text("SELECT * FROM layer_name WHERE formid = :fid"),
        {"fid": formid},
    )
    return [LayerOut(**row) for row in result.mappings()]


@router.delete("/layer_names/{gid}")
async def delete_layer(gid: int, db: AsyncSession = Depends(get_db)):
    async with db.begin():
        del_result = await db.execute(
            text("DELETE FROM layer_name WHERE gid = :gid RETURNING formid AS table_name"),
            {"gid": gid},
        )
        row = del_result.mappings().first()
        if not row:
            raise HTTPException(404, "Entry not found")
        table_name = row["table_name"]
        _assert_safe(table_name)
        await db.execute(text(f'DROP TABLE IF EXISTS "{table_name}"'))
    return {"success": True}


# ─── Create table ─────────────────────────────────────────────────────────────

@router.post("/create_table", response_model=CreateLayerResponse)
async def create_table(body: CreateLayerRequest, db: AsyncSession = Depends(get_db)):
    if not body.columns:
        raise HTTPException(400, "At least one column is required")

    formid = f"fid_{int(time.time() * 1000)}"

    async with db.begin():
        await db.execute(
            text("INSERT INTO layer_name (formid, division, layername, layertype, ts) VALUES (:fid, :div, :ln, :lt, NOW())"),
            {"fid": formid, "div": body.division, "ln": body.layername, "lt": body.layertype},
        )
        await db.execute(text(f"""
            CREATE TABLE "{formid}" (
                id SERIAL PRIMARY KEY,
                refid TEXT,
                geom GEOMETRY({body.layertype}, 4326),
                ts TIMESTAMP DEFAULT NOW(),
                style TEXT
            )
        """))

        alter_parts = []
        for i, col in enumerate(body.columns):
            col_id = f"{formid}_{i}"
            col_type = col.column_type if col.column_type != "file" else "text"
            pg_type = PG_TYPE_MAP.get(col_type, "TEXT")
            if pg_type not in PG_TYPE_MAP.values():
                raise HTTPException(400, f"Invalid column type: {col_type}")
            await db.execute(
                text("INSERT INTO layer_column (formid, col_id, col_name, col_type, col_desc) VALUES (:fid, :cid, :cn, :ct, :cd)"),
                {"fid": formid, "cid": col_id, "cn": col.column_name, "ct": col.column_type, "cd": col.column_desc},
            )
            alter_parts.append(f'ADD COLUMN "{col_id}" {pg_type}')

        if alter_parts:
            await db.execute(text(f'ALTER TABLE "{formid}" {", ".join(alter_parts)}'))

    return CreateLayerResponse(formid=formid)


# ─── Load layer ───────────────────────────────────────────────────────────────

@router.get("/load_layer/{formid}", response_model=LoadLayerResponse)
async def load_layer(formid: str, db: AsyncSession = Depends(get_db)):
    if not _VALID_ID.match(formid):
        raise HTTPException(400, "Invalid table name")

    structure_res = await db.execute(
        text("SELECT col_id, col_name, col_type, col_desc FROM layer_column WHERE formid = :fid"),
        {"fid": formid},
    )
    structure = [dict(r) for r in structure_res.mappings()]
    if not structure:
        raise HTTPException(404, "No metadata found for this form")

    cols_res = await db.execute(
        text("SELECT column_name FROM information_schema.columns WHERE table_name = :t AND column_name != 'geom'"),
        {"t": formid},
    )
    col_list = ", ".join(f'"{r["column_name"]}"' for r in cols_res.mappings())
    select_cols = f"{col_list}, ST_AsGeoJSON(geom) as geojson" if col_list else "ST_AsGeoJSON(geom) as geojson"

    data_res = await db.execute(text(f'SELECT {select_cols} FROM "{formid}" ORDER BY ts DESC'))
    data = [dict(r) for r in data_res.mappings()]

    return LoadLayerResponse(structure=structure, data=data)


@router.post("/load_layer")
async def load_layer_post(body: dict, db: AsyncSession = Depends(get_db)):
    formid = body.get("formid", "")
    if not formid or not isinstance(formid, str):
        raise HTTPException(400, "Invalid formid")

    cols_res = await db.execute(
        text("SELECT column_name FROM information_schema.columns WHERE table_name = :t AND column_name != 'geom'"),
        {"t": formid},
    )
    col_list = ", ".join(f'"{r["column_name"]}"' for r in cols_res.mappings())
    select_cols = f"{col_list}, ST_AsGeoJSON(geom) as geojson" if col_list else "ST_AsGeoJSON(geom) as geojson"
    result = await db.execute(text(f'SELECT {select_cols} FROM "{formid}" ORDER BY ts DESC'))
    return [dict(r) for r in result.mappings()]


@router.get("/load_layer/{formid}/{refid}")
async def load_layer_by_refid(formid: str, refid: str, db: AsyncSession = Depends(get_db)):
    cols_res = await db.execute(
        text("SELECT column_name FROM information_schema.columns WHERE table_name = :t AND column_name != 'geom'"),
        {"t": formid},
    )
    col_list = ", ".join(r["column_name"] for r in cols_res.mappings())
    result = await db.execute(
        text(f'SELECT {col_list}, ST_AsGeoJSON(geom) as geojson FROM "{formid}" WHERE refid = :rid ORDER BY ts DESC'),
        {"rid": refid},
    )
    return [dict(r) for r in result.mappings()]


@router.get("/load_layer_description/{formid}")
async def load_layer_description(formid: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        text("SELECT * FROM layer_column WHERE formid = :fid"),
        {"fid": formid},
    )
    return [dict(r) for r in result.mappings()]


@router.get("/load_feature_style/{formid}/{refid}")
async def load_feature_style(formid: str, refid: str, db: AsyncSession = Depends(get_db)):
    _assert_safe(formid)
    result = await db.execute(
        text(f'SELECT style FROM "{formid}" WHERE refid = :rid'),
        {"rid": refid},
    )
    row = result.mappings().first()
    return dict(row) if row else {}


# ─── Row / Feature CRUD ───────────────────────────────────────────────────────

@router.post("/insert_row")
async def insert_row(body: InsertRowRequest, db: AsyncSession = Depends(get_db)):
    _assert_safe(body.formid)
    if body.geojson:
        result = await db.execute(
            text(f'INSERT INTO "{body.formid}" (refid, geom) VALUES (:rid, ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326)) RETURNING *'),
            {"rid": body.refid, "geojson": body.geojson},
        )
    else:
        result = await db.execute(
            text(f'INSERT INTO "{body.formid}" (refid) VALUES (:rid) RETURNING *'),
            {"rid": body.refid},
        )
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(500, "Failed to insert feature")

    # Update dynamic column properties if provided
    if body.properties:
        valid = {k: (None if v == "" else v) for k, v in body.properties.items() if _VALID_ID.match(k)}
        if valid:
            set_clause = ", ".join(f'"{k}" = :{k}' for k in valid)
            params = {**valid, "__refid": body.refid}
            await db.execute(text(f'UPDATE "{body.formid}" SET {set_clause} WHERE refid = :__refid'), params)
            await db.commit()

    return {"message": "Feature inserted successfully", "feature": dict(result.mappings().first())}


@router.delete("/delete_row")
async def delete_row(body: DeleteRowRequest, db: AsyncSession = Depends(get_db)):
    _assert_safe(body.formid)
    await db.execute(
        text(f'DELETE FROM "{body.formid}" WHERE refid = :rid'),
        {"rid": body.refid},
    )
    await db.commit()
    return {"message": "Feature deleted successfully"}


@router.put("/update_row/{formid}/{refid}")
async def update_row(formid: str, refid: str, body: dict[str, Any], db: AsyncSession = Depends(get_db)):
    _assert_safe(formid)
    cleaned = {k: (None if v == "" else v) for k, v in body.items()}
    if not cleaned:
        raise HTTPException(400, "No fields to update")

    set_clause = ", ".join(f"{k} = :{k}" for k in cleaned)
    params = {**cleaned, "__refid": refid}
    result = await db.execute(
        text(f'UPDATE "{formid}" SET {set_clause} WHERE refid = :__refid RETURNING *'),
        params,
    )
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(404, "Feature not found")
    return {"message": "Data updated successfully", "data": dict(result.mappings().first())}


@router.post("/update_layer")
async def update_layer(body: UpdateLayerRequest, db: AsyncSession = Depends(get_db)):
    async with db.begin():
        for change in body.changes:
            if not change.changes:
                continue
            keys = list(change.changes.keys())
            for col in keys:
                if not _VALID_ID.match(col):
                    raise HTTPException(400, f"Invalid column name: {col}")
            set_clause = ", ".join(f'"{col}" = :{col}' for col in keys)
            params = {**change.changes, "__refid": change.refid}
            await db.execute(
                text(f'UPDATE "{body.formid}" SET {set_clause} WHERE refid = :__refid'),
                params,
            )
    return {"message": "Layers updated successfully", "changes": body.changes}


@router.put("/update_feature")
async def update_feature(body: UpdateFeatureRequest, db: AsyncSession = Depends(get_db)):
    _assert_safe(body.formid)
    result = await db.execute(
        text(f'UPDATE "{body.formid}" SET geom = ST_SetSRID(ST_GeomFromGeoJSON(:geojson), 4326), style = :style WHERE refid = :rid RETURNING *'),
        {"geojson": body.geojson, "style": body.style, "rid": body.refid},
    )
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(404, "Feature not found")
    return {"message": "Feature updated successfully", "feature": dict(result.mappings().first())}


@router.put("/update_feature_style")
async def update_feature_style(body: UpdateFeatureStyleRequest, db: AsyncSession = Depends(get_db)):
    _assert_safe(body.formid)
    await db.execute(
        text(f'UPDATE "{body.formid}" SET style = :style WHERE refid = :rid'),
        {"style": body.style, "rid": body.refid},
    )
    await db.commit()
    return {"message": "Feature style updated successfully"}


@router.delete("/delete_feature")
async def delete_feature(body: DeleteFeatureRequest, db: AsyncSession = Depends(get_db)):
    _assert_safe(body.formid)
    result = await db.execute(
        text(f'DELETE FROM "{body.formid}" WHERE refid = :rid RETURNING *'),
        {"rid": body.refid},
    )
    await db.commit()
    if result.rowcount == 0:
        raise HTTPException(404, "Feature not found")
    return {"message": "Feature deleted successfully", "feature": dict(result.mappings().first())}


# ─── Column management ────────────────────────────────────────────────────────

@router.post("/create_column/{formid}")
async def create_column(formid: str, body: CreateColumnRequest, db: AsyncSession = Depends(get_db)):
    if not _VALID_ANY.match(formid) or not _VALID_ANY.match(body.col_id):
        raise HTTPException(400, "Invalid ID format")

    pg_type = PG_TYPE_MAP.get(body.col_type, "TEXT")

    async with db.begin():
        result = await db.execute(
            text("INSERT INTO layer_column (formid, col_id, col_name, col_type, col_desc) VALUES (:fid, :cid, :cn, :ct, :cd) RETURNING *"),
            {"fid": formid, "cid": body.col_id, "cn": body.col_name, "ct": body.col_type, "cd": body.col_desc},
        )
        await db.execute(text(f'ALTER TABLE "{formid}" ADD COLUMN "{body.col_id}" {pg_type}'))

    return {"message": "Column created successfully", "column": dict(result.mappings().first())}


@router.put("/update_column/{formid}/{refid}")
async def update_column(formid: str, refid: str, body: dict[str, str], db: AsyncSession = Depends(get_db)):
    if not body:
        raise HTTPException(400, "No fields to update")

    value_clauses = []
    params: list[Any] = []
    for i, (col_id, col_name) in enumerate(body.items(), 1):
        value_clauses.append(f"(${i * 2 - 1}, ${i * 2})")
        params.extend([col_id, col_name])

    params.append(formid)
    # Use raw asyncpg-style for this query
    query = f"""
        WITH updated_data (col_id, col_name) AS (VALUES {', '.join(value_clauses)})
        UPDATE layer_column lc
        SET col_name = ud.col_name
        FROM updated_data ud
        WHERE lc.col_id = ud.col_id AND lc.formid = ${len(params)}
    """
    # Fallback to positional via raw connection
    async with db.bind.connect() as conn:  # type: ignore[attr-defined]
        result = await conn.execute(query, *params)
        if result.split()[-1] == "0":
            raise HTTPException(404, "No rows updated")

    return {"message": "Column(s) updated successfully"}


@router.delete("/delete_column/{formid}/{colid}")
async def delete_column(formid: str, colid: str, db: AsyncSession = Depends(get_db)):
    if not _VALID_ANY.match(formid):
        raise HTTPException(400, "Invalid form ID format")

    async with db.begin():
        del_result = await db.execute(
            text("DELETE FROM layer_column WHERE formid = :fid AND col_id = :cid RETURNING *"),
            {"fid": formid, "cid": colid},
        )
        if del_result.rowcount == 0:
            raise HTTPException(404, "Column not found")
        await db.execute(text(f'ALTER TABLE "{formid}" DROP COLUMN IF EXISTS "{colid}"'))

    return {"message": f"Column {colid} deleted successfully", "deletedColumn": dict(del_result.mappings().first())}


# ─── CSV / Excel upload ───────────────────────────────────────────────────────

@router.post("/upload_csv")
async def upload_csv(
    division: str = Form(...),
    layername: str = Form(...),
    layertype: str = Form(default="point"),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Create a new layer table from a CSV or Excel file upload.
    Reads the first row as column headers, creates the table and inserts rows.
    Geometry is expected in columns named 'latitude'/'longitude' or 'lat'/'lng'.
    """
    import pandas as pd

    contents = await file.read()
    filename = (file.filename or "").lower()

    try:
        if filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(400, f"Cannot parse file: {e}")

    if df.empty:
        raise HTTPException(400, "File is empty")

    # Detect lat/lng columns
    lat_col = next((c for c in df.columns if c.strip().lower() in ("latitude", "lat")), None)
    lng_col = next((c for c in df.columns if c.strip().lower() in ("longitude", "lng", "lon")), None)
    has_geo = lat_col and lng_col
    actual_layertype = layertype if has_geo else "point"

    formid = f"fid_{int(time.time() * 1000)}"

    async with db.begin():
        await db.execute(
            text("INSERT INTO layer_name (formid, division, layername, layertype, ts) VALUES (:fid, :div, :ln, :lt, NOW())"),
            {"fid": formid, "div": division, "ln": layername, "lt": actual_layertype},
        )
        await db.execute(text(f"""
            CREATE TABLE "{formid}" (
                id SERIAL PRIMARY KEY,
                refid TEXT,
                geom GEOMETRY(Point, 4326),
                ts TIMESTAMP DEFAULT NOW(),
                style TEXT
            )
        """))

        # Register all non-lat/lng columns as layer_column metadata
        data_cols = [c for c in df.columns if c not in (lat_col, lng_col)]
        col_map: dict[str, str] = {}  # original_name -> col_id
        for i, col in enumerate(data_cols):
            col_id = f"{formid}_{i}"
            col_map[col] = col_id
            await db.execute(
                text("INSERT INTO layer_column (formid, col_id, col_name, col_type, col_desc) VALUES (:fid, :cid, :cn, 'text', '')"),
                {"fid": formid, "cid": col_id, "cn": col},
            )

        if col_map:
            alter_parts = [f'ADD COLUMN "{cid}" TEXT' for cid in col_map.values()]
            await db.execute(text(f'ALTER TABLE "{formid}" {", ".join(alter_parts)}'))

        # Insert rows
        for _, row in df.iterrows():
            refid = f"ref_{secrets.token_hex(6)}"
            col_ids = list(col_map.values())
            col_names_sql = ", ".join(f'"{c}"' for c in col_ids)
            placeholders = ", ".join(f":{c}" for c in col_ids)
            values: dict[str, Any] = {"fid": formid, "rid": refid}

            if has_geo:
                try:
                    lat = float(row[lat_col])
                    lng = float(row[lng_col])
                    geom_expr = f"ST_SetSRID(ST_MakePoint({lng}, {lat}), 4326)"
                except (ValueError, TypeError):
                    geom_expr = "NULL"
            else:
                geom_expr = "NULL"

            for orig, cid in col_map.items():
                values[cid] = str(row[orig]) if not (hasattr(row[orig], '__class__') and str(row[orig]) == 'nan') else None

            if col_ids:
                insert_sql = f'INSERT INTO "{formid}" (refid, geom, {col_names_sql}) VALUES (:rid, {geom_expr}, {placeholders})'
            else:
                insert_sql = f'INSERT INTO "{formid}" (refid, geom) VALUES (:rid, {geom_expr})'

            # remove the 'fid' from values since it's not used in insert
            insert_values = {k: v for k, v in values.items() if k != 'fid'}
            await db.execute(text(insert_sql), insert_values)

    return {"success": True, "formid": formid, "rows": len(df), "columns": list(col_map.keys())}
