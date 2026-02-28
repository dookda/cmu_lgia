from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class DivisionOut(BaseModel):
    id: int
    division_name: str
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class CreateDivisionRequest(BaseModel):
    division_name: str


class UpdateDivisionRequest(BaseModel):
    division_name: str
