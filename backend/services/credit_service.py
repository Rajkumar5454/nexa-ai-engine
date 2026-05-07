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
    "gemini-3-flash": 2.0,     # → 20 credits
    "llama-3-3-70b": 1.5,      # → 15 credits
    "gpt-4o": 2.0,             # → 20 credits
    "gpt-5.4": 2.5,            # → 25 credits
    "gpt-5.5": 3.0,            # → 30 credits
    "claude-sonnet-4-5": 2.5,  # → 25 credits
    "gemini-3-1-pro": 2.5,     # → 25 credits
}


def get_generate_cost(model_id):
    """Return the credit cost for a generate action with the given model."""
    base = CREDIT_COSTS["generate"]
    mult = MODEL_MULTIPLIERS.get(model_id, 1.0)
    return int(round(base * mult))


from db import db as _db


async def require_and_deduct_credits(user_id: str, action: str, model_id: str | None = None, is_v2: bool = False):
    """
    Ensure the user has enough credits for the given action; if yes, deduct.
    Cost varies per model when action == "generate".
    is_v2=True bypasses all checks (Sandbox God Mode).
    """
    if is_v2 or os.environ.get('MONGO_URL') == 'mock':
        return 5000

    cost = get_generate_cost(model_id) if (action == "generate" and model_id) else CREDIT_COSTS.get(action, 0)

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
