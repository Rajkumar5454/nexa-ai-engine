"""Credit management: costs per action (and per model), enforce + deduct on AI calls."""
from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
import os

# Base cost per action type
CREDIT_COSTS = {
    "generate": 10,   # full app generation / modification (default)
    "chat": 2,        # chat reply
    "analyze": 5,     # cofounder audit
}

# Per-model multipliers for the "generate" action.
# Values are multiplied by CREDIT_COSTS["generate"] (10).
MODEL_MULTIPLIERS = {
    "gemini-3-flash": 0.2,     # → 2 credits (Budget/Fast)
    "llama-3-3-70b": 0.5,      # → 5 credits
    "gpt-4o": 0.8,             # → 8 credits
    "gpt-5.4": 1.0,            # → 10 credits (Pro)
    "gpt-5.5": 2.0,            # → 20 credits (Elite)
    "claude-sonnet-4-5": 1.5,  # → 15 credits
    "gemini-3-1-pro": 1.2,     # → 12 credits
}


def get_generate_cost(model_id):
    """Return the credit cost for a generate action with the given model."""
    base = CREDIT_COSTS["generate"]
    mult = MODEL_MULTIPLIERS.get(model_id, 1.0)
    return int(round(base * mult))


from db import db as _db


async def require_and_deduct_credits(user_id: str, action: str, model_id: str | None = None):
    """
    Ensure the user has enough credits for the given action; if yes, deduct.
    Cost varies per model when action == "generate".
    Raises 403 with a structured detail if insufficient.
    Returns the new credit balance.
    """
    if action == "generate" and model_id:
        cost = get_generate_cost(model_id)
    else:
        cost = CREDIT_COSTS.get(action, 0)

    if cost <= 0 or not user_id:
        return None  # no enforcement for anonymous / free actions

    user = await _db.users.find_one({"id": user_id}, {"_id": 0, "credits": 1})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    current = user.get("credits", 0) or 0
    if current < cost:
        raise HTTPException(
            status_code=403,
            detail={
                "code": "insufficient_credits",
                "message": f"Not enough credits. This action costs {cost}, you have {current}.",
                "required": cost,
                "available": current,
            },
        )

    # Atomic conditional decrement
    result = await _db.users.update_one(
        {"id": user_id, "credits": {"$gte": cost}},
        {"$inc": {"credits": -cost}},
    )
    if result.modified_count != 1:
        # Race condition — someone else spent them concurrently
        raise HTTPException(status_code=403, detail={"code": "insufficient_credits", "message": "Credits changed during request, please retry."})

    return current - cost
