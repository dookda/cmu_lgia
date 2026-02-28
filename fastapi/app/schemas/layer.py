from pydantic import BaseModel, field_validator
from typing import Optional, Any
from datetime import datetime
import re


class LayerOut(BaseModel):
    gid: int
    formid: str
    division: Optional[str] = None
    layername: Optional[str] = None
    layertype: Optional[str] = None
    ts: Optional[datetime] = None

    model_config = {"from_attributes": True}


class LayerColumn(BaseModel):
    column_name: str
    column_type: str
    column_desc: str


class CreateLayerRequest(BaseModel):
    division: str
    layername: str
    layertype: str
    columns: list[LayerColumn]

    @field_validator("layertype")
    @classmethod
    def validate_layertype(cls, v: str) -> str:
        valid = {"POINT", "LINESTRING", "POLYGON", "MULTIPOINT", "MULTILINESTRING", "MULTIPOLYGON"}
        if v.upper() not in valid:
            raise ValueError(f"layertype must be one of {valid}")
        return v


class CreateLayerResponse(BaseModel):
    formid: str


class LayerStructure(BaseModel):
    col_id: str
    col_name: str
    col_type: str
    col_desc: Optional[str] = None


class LoadLayerResponse(BaseModel):
    structure: list[LayerStructure]
    data: list[dict[str, Any]]


class UpdateLayerChange(BaseModel):
    refid: str
    changes: dict[str, Any]


class UpdateLayerRequest(BaseModel):
    formid: str
    changes: list[UpdateLayerChange]

    @field_validator("formid")
    @classmethod
    def validate_formid(cls, v: str) -> str:
        if not re.match(r"^[a-zA-Z_][a-zA-Z0-9_]*$", v):
            raise ValueError("Invalid formid")
        return v


class InsertRowRequest(BaseModel):
    formid: str
    refid: str

    @field_validator("formid")
    @classmethod
    def validate_formid(cls, v: str) -> str:
        if not re.match(r"^[a-zA-Z_][a-zA-Z0-9_]*$", v):
            raise ValueError("Invalid formid")
        return v


class DeleteRowRequest(BaseModel):
    formid: str
    refid: str


class UpdateFeatureRequest(BaseModel):
    formid: str
    refid: str
    geojson: str
    style: Optional[str] = None


class DeleteFeatureRequest(BaseModel):
    formid: str
    refid: str


class UpdateFeatureStyleRequest(BaseModel):
    formid: str
    refid: str
    style: str


class CreateColumnRequest(BaseModel):
    col_id: str
    col_name: str
    col_type: str
    col_desc: Optional[str] = None
