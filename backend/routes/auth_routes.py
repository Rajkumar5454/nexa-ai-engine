from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from models.user import User, UserCreate, UserLogin, UserResponse
from services.auth_service import verify_password, get_password_hash, create_access_token, decode_token
from motor.motor_asyncio import AsyncIOMotorClient
import os
from typing import Optional
from datetime import datetime

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

router = APIRouter(prefix="/auth", tags=["auth"])

from db import db

async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = payload.get("sub")
    user = await db.users.find_one({"id": user_id})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return User(**user)

@router.post("/signup", response_model=dict)
async def signup(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        name=user_data.name,
        credits=100,
        plan="free"
    )
    
    await db.users.insert_one(user.dict())
    
    # Create token
    access_token = create_access_token(data={"sub": user.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(**user.dict())
    }

@router.post("/login", response_model=dict)
async def login(credentials: UserLogin):
    # Find user
    user_data = await db.users.find_one({"email": credentials.email})
    
    if not user_data or not verify_password(credentials.password, user_data["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = User(**user_data)
    
    # Update last login
    await db.users.update_one(
        {"id": user.id},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    # Create token
    access_token = create_access_token(data={"sub": user.id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(**user.dict())
    }

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(**current_user.dict())

@router.post("/logout")
async def logout():
    return {"message": "Logged out successfully"}


GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID")


class GoogleIdTokenRequest(BaseModel):
    credential: str  # The ID token (JWT) returned by Google in the browser


@router.post("/google", response_model=dict)
async def google_auth(payload: GoogleIdTokenRequest):
    """
    Verify a Google ID token (issued directly by Google to the browser),
    upsert the user, and return our app JWT.
    """
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google OAuth is not configured")
    if not payload.credential:
        raise HTTPException(status_code=400, detail="credential is required")

    # Verify the Google-issued JWT. This checks the signature, issuer, audience, and expiry.
    try:
        idinfo = id_token.verify_oauth2_token(
            payload.credential,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=10,
        )
    except ValueError as e:
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {e}")

    email = idinfo.get("email")
    email_verified = idinfo.get("email_verified", False)
    name = idinfo.get("name") or (email.split("@")[0] if email else "User")
    picture = idinfo.get("picture")

    if not email or not email_verified:
        raise HTTPException(status_code=401, detail="Google account email not verified")

    # Upsert user by email
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user = User(**existing)
        await db.users.update_one(
            {"id": user.id},
            {"$set": {
                "last_login": datetime.utcnow(),
                "picture": picture or existing.get("picture"),
                "name": existing.get("name") or name,
            }},
        )
    else:
        user = User(
            email=email,
            name=name,
            password_hash=None,
            credits=100,
            plan="free",
            auth_provider="google",
            picture=picture,
            last_login=datetime.utcnow(),
        )
        await db.users.insert_one(user.dict())

    access_token = create_access_token(data={"sub": user.id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(**user.dict()),
    }
