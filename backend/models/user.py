from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime
import uuid

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    password_hash: Optional[str] = None  # Optional — Google-auth users have no password
    name: str
    credits: int = 100  # Free credits on signup
    plan: str = "free"  # free, pro, enterprise
    auth_provider: str = "email"  # "email" | "google"
    picture: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    credits: int
    plan: str
    auth_provider: str = "email"
    picture: Optional[str] = None
    created_at: datetime
