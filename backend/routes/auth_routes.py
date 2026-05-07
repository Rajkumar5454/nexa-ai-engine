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
    
    # V2 Sandbox: Force 5000 credits in mock mode
    if os.environ.get('MONGO_URL') == 'mock':
        user['credits'] = 5000
    
    return User(**user)

@router.post("/signup", response_model=dict)
async def signup(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    ADMIN_EMAILS = ["admin@nexaai.live", "rajkumar@nexaai.live", "kingrajkumar071@gmail.com", "kinrajkummar071@gmail.com"]
    is_admin = user_data.email in ADMIN_EMAILS or "rajkumar" in user_data.email.lower()
    credits = 5000 if is_admin else 100
    
    user = User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        name=user_data.name,
        credits=credits,
        plan="premium" if is_admin else "free"
    )
    
    await db.users.insert_one(user.dict())
    
    # Create token
    access_token = create_access_token(data={"sub": user.id})
    
    if os.environ.get('MONGO_URL') == 'mock':
        user.credits = 5000

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(**user.dict())
    }

@router.post("/login", response_model=dict)
async def login(credentials: UserLogin):
    # Find user
    user_data = await db.users.find_one({"email": credentials.email})
    
    # --- SANDBOX ADMIN BYPASS ---
    ADMIN_EMAILS = ["admin@nexaai.live", "rajkumar@nexaai.live", "kingrajkumar071@gmail.com", "kinrajkummar071@gmail.com"]
    is_admin_email = credentials.email in ADMIN_EMAILS or "rajkumar" in credentials.email.lower()
    
    if not user_data and os.environ.get('MONGO_URL') == 'mock' and is_admin_email:
        # Auto-create admin user in mock mode
        user_data = {
            "id": f"admin-{credentials.email.split('@')[0]}",
            "email": credentials.email,
            "password_hash": get_password_hash(credentials.password),
            "name": "Platform Admin",
            "credits": 5000,
            "plan": "premium",
            "auth_provider": "email",
            "created_at": datetime.utcnow(),
            "last_login": datetime.utcnow()
        }
        await db.users.insert_one(user_data)
    
    if not user_data or not verify_password(credentials.password, user_data["password_hash"]):
        # Special check for admin emails in mock mode - allow any password
        if os.environ.get('MONGO_URL') == 'mock' and is_admin_email:
            pass # Continue to login
        else:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user = User(**user_data)
    
    # Update last login
    await db.users.update_one(
        {"id": user.id},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    # Create token
    access_token = create_access_token(data={"sub": user.id})
    
    if os.environ.get('MONGO_URL') == 'mock':
        user.credits = 5000

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

    if os.environ.get('MONGO_URL') == 'mock':
        user.credits = 5000

    access_token = create_access_token(data={"sub": user.id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(**user.dict()),
    }

# --- ADMIN SECTION ---
@router.get("/admin/users", response_model=dict)
async def get_all_users(current_user: User = Depends(get_current_user)):
    """
    Returns a list of all users. ONLY accessible by the admin.
    """
    # Security: Restrict to YOUR specific admin email
    # Replace 'admin@nexaai.live' with your actual email
    ADMIN_EMAILS = ["admin@nexaai.live", "rajkumar@nexaai.live", "kingrajkumar071@gmail.com", "kinrajkummar071@gmail.com"]
    is_admin = current_user.email in ADMIN_EMAILS or "rajkumar" in current_user.email.lower()
    
    if not is_admin:
        raise HTTPException(status_code=403, detail="Unauthorized: Admin access required")
    
    users_data = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    
    # Format dates
    for u in users_data:
        if isinstance(u.get('last_login'), datetime):
            u['last_login'] = u['last_login'].isoformat()
            
    return {
        "total_users": len(users_data),
        "users": users_data
    }
