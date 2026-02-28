from pydantic import BaseModel, EmailStr
from typing import Optional


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    password: str
    email: EmailStr


class UserSession(BaseModel):
    userId: str
    displayName: str
    pictureUrl: Optional[str] = None
    auth: str
    division: Optional[str] = None


class ProfileResponse(BaseModel):
    success: bool
    auth: bool
    user: Optional[UserSession] = None


class LoginResponse(BaseModel):
    success: bool
    message: str


class RegisterResponse(BaseModel):
    success: bool
    user: Optional[dict] = None
    message: Optional[str] = None
