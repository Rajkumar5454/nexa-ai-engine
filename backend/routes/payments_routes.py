from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
import os
import razorpay
from datetime import datetime

from routes.auth_routes import get_current_user
from models.user import User

router = APIRouter(prefix="/payments", tags=["payments"])

from db import db

def get_razorpay_client():
    key_id = os.environ.get("RAZORPAY_KEY_ID")
    key_secret = os.environ.get("RAZORPAY_KEY_SECRET")
    if not key_id or not key_secret:
        return None
    return razorpay.Client(auth=(key_id, key_secret))

# Pricing plans — amount in paise (INR * 100), credits granted on payment.
PLANS = {
    "pro":      {"name": "Pro",      "amount": 50000,  "credits": 1500,  "duration_days": 30},
    "business": {"name": "Business", "amount": 100000, "credits": 4000,  "duration_days": 30},
    "agency":   {"name": "Agency",   "amount": 200000, "credits": 10000, "duration_days": 30},
    # One-time Credit Packs
    "pack_100":  {"name": "100 Credits Pack",  "amount": 1000,   "credits": 100,  "type": "pack"},
    "pack_500":  {"name": "500 Credits Pack",  "amount": 39900,  "credits": 500,  "type": "pack"},
    "pack_1000": {"name": "1000 Credits Pack", "amount": 74900,  "credits": 1000, "type": "pack"},
}


class CreateOrderRequest(BaseModel):
    plan_id: str  # "pro" | "business" | "agency"


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    plan_id: str


@router.get("/config")
async def get_config():
    """Public endpoint — returns key_id for Razorpay Checkout and plan details."""
    key_id = os.environ.get("RAZORPAY_KEY_ID")
    return {
        "key_id": key_id,
        "plans": PLANS,
        "enabled": bool(key_id and os.environ.get("RAZORPAY_KEY_SECRET")),
    }


@router.post("/create-order")
async def create_order(payload: CreateOrderRequest, current_user: User = Depends(get_current_user)):
    client = get_razorpay_client()
    if not client:
        raise HTTPException(status_code=500, detail="Razorpay is not configured (missing keys)")

    plan = PLANS.get(payload.plan_id)
    if not plan:
        raise HTTPException(status_code=400, detail=f"Unknown plan: {payload.plan_id}")

    # Receipt must be <= 40 chars
    receipt = f"nx_{payload.plan_id}_{current_user.id[:8]}_{int(datetime.utcnow().timestamp())}"[:40]

    try:
        order = client.order.create({
            "amount": plan["amount"],
            "currency": "INR",
            "receipt": receipt,
            "payment_capture": 1,
            "notes": {
                "user_id": current_user.id,
                "user_email": current_user.email,
                "plan_id": payload.plan_id,
            },
        })
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Razorpay order creation failed: {e}")

    # Persist order
    await db.payment_orders.insert_one({
        "order_id": order["id"],
        "user_id": current_user.id,
        "plan_id": payload.plan_id,
        "amount": plan["amount"],
        "status": "created",
        "created_at": datetime.utcnow().isoformat(),
    })

    return {
        "order_id": order["id"],
        "amount": order["amount"],
        "currency": order["currency"],
        "key_id": os.environ.get("RAZORPAY_KEY_ID"),
        "plan": plan,
    }


@router.post("/verify")
async def verify_payment(payload: VerifyPaymentRequest, current_user: User = Depends(get_current_user)):
    client = get_razorpay_client()
    if not client:
        raise HTTPException(status_code=500, detail="Razorpay is not configured")

    plan = PLANS.get(payload.plan_id)
    if not plan:
        raise HTTPException(status_code=400, detail=f"Unknown plan: {payload.plan_id}")

    # Verify signature using Razorpay utility (HMAC SHA256 of order_id|payment_id)
    try:
        client.utility.verify_payment_signature({
            "razorpay_order_id": payload.razorpay_order_id,
            "razorpay_payment_id": payload.razorpay_payment_id,
            "razorpay_signature": payload.razorpay_signature,
        })
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid payment signature")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Signature verification failed: {e}")

    # Grant credits + upgrade plan
    new_credits = (current_user.credits or 0) + plan["credits"]
    update_data = {"credits": new_credits}
    
    # Only change the "plan" if it's not a one-time pack
    if plan.get("type") != "pack":
        update_data["plan"] = payload.plan_id
        update_data["plan_updated_at"] = datetime.utcnow().isoformat()

    await db.users.update_one(
        {"id": current_user.id},
        {"$set": update_data},
    )

    await db.payment_orders.update_one(
        {"order_id": payload.razorpay_order_id},
        {"$set": {
            "status": "paid",
            "payment_id": payload.razorpay_payment_id,
            "paid_at": datetime.utcnow().isoformat(),
        }},
    )

    return {
        "success": True,
        "plan": payload.plan_id,
        "credits": new_credits,
        "credits_added": plan["credits"],
    }
