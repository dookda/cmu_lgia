from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class UserOut(BaseModel):
    id: int
    username: Optional[str] = None
    displayname: Optional[str] = None
    email: Optional[str] = None
    ts: Optional[datetime] = None
    auth: Optional[str] = None
    division: Optional[str] = None

    model_config = {"from_attributes": True}


class CreateUserRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    auth: Optional[str] = "user"
    division: Optional[str] = "N/A"


class UpdateUserRequest(BaseModel):
    username: str
    email: EmailStr
    auth: str
    division: str


class UpdateProfileRequest(BaseModel):
    displayName: str
    userName: str
    userEmail: EmailStr
    userDivision: str


class InfoOut(BaseModel):
    id: Optional[int] = None
    name: Optional[str] = None
    img: Optional[str] = None

    model_config = {"from_attributes": True}


class UpdateInfoRequest(BaseModel):
    name: str
    img: Optional[str] = None
