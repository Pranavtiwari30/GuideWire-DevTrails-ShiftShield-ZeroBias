from fastapi import APIRouter, Depends
from app.engine.decision import decide_on_claim
from app.payout.payout import calculate_payout

router = APIRouter()

@router.post("/claim/evaluate")
async def evaluate_claim(claim_data):
    score = score_shift(claim_data)
    decision = decide_on_claim(score)
    payout = calculate_payout(claim_data["id"])
    return {"score": score, "decision": decision, "payout": payout}

@router.get("/claim/{id}/status")
async def get_claim_status(id: str):
    # Placeholder status logic
    return {"id": id, "status": "pending"}
