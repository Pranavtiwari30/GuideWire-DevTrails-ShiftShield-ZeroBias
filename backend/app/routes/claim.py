from datetime import datetime, timezone, timedelta
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from app.database import get_db
from app.schemas import EvaluateClaimRequest, EvaluateClaimResponse, ClaimStatusResponse
from app.engine.scoring  import run_scoring_engine
from app.engine.decision import make_decision
from app.payout.payout   import run_payout_engine

router = APIRouter(prefix="/claim", tags=["Claim"])


def _new_claim_id() -> str:
    return f"CLM-{uuid4().hex[:8].upper()}"


@router.post("/evaluate", response_model=EvaluateClaimResponse)
async def evaluate_claim(body: EvaluateClaimRequest):
    db = get_db()

    # Verify shift exists
    shift = await db.shifts.find_one({"shift_id": body.shift_id, "rider_id": body.rider_id})
    if not shift:
        raise HTTPException(
            status_code=404,
            detail=f"Shift {body.shift_id} not found for rider {body.rider_id}"
        )

    # Rate limit — one evaluation per 15 min window
    window_start = datetime.now(timezone.utc) - timedelta(minutes=15)
    recent = await db.claims.find_one({
        "shift_id":     body.shift_id,
        "rider_id":     body.rider_id,
        "evaluated_at": {"$gte": window_start},
    })
    if recent:
        next_eligible = recent["evaluated_at"] + timedelta(minutes=15)
        raise HTTPException(
            status_code=429,
            detail={
                "error":            "CLAIM_RATE_LIMITED",
                "message":          "Claims are evaluated once per 15-minute window.",
                "claim_id":         recent["claim_id"],
                "next_eligible_at": next_eligible.isoformat(),
            },
        )

    print(f"[Claim] Evaluating shift={body.shift_id} rider={body.rider_id} pincode={body.pincode}")

    # Full pipeline
    scoring  = await run_scoring_engine(body.rider_id, body.pincode, body.shift_start)
    decision = make_decision(scoring)
    payout   = run_payout_engine(scoring, decision)

    claim_id     = _new_claim_id()
    evaluated_at = datetime.now(timezone.utc)

    await db.claims.insert_one({
        "claim_id":               claim_id,
        "shift_id":               body.shift_id,
        "rider_id":               body.rider_id,
        "pincode":                body.pincode,
        "confidence_score":       scoring.confidence_score,
        "signals_triggered":      scoring.signals_triggered,
        "all_five_triggered":     scoring.all_five_triggered,
        "individual_scores":      scoring.individual_scores.model_dump(),
        "feature_vector":         scoring.feature_vector,
        "ml_raw_score":           scoring.ml_raw_score,
        "signal_details":         scoring.signals.model_dump(),
        "decision":               decision.decision,
        "decision_reason":        decision.reason,
        "requires_manual_review": decision.requires_manual_review,
        "eligible":               payout.eligible,
        "base_amount":            payout.base_amount,
        "disruption_multiplier":  payout.disruption_multiplier,
        "final_amount":           payout.final_amount,
        "upi_ref":                payout.upi_ref,
        "transfer_status":        payout.transfer_status,
        "evaluated_at":           evaluated_at,
        "created_at":             evaluated_at,
    })

    print(f"[Claim] {claim_id} → {decision.decision} | Score: {scoring.confidence_score} | ₹{payout.final_amount}")

    return EvaluateClaimResponse(
        claim_id=claim_id,
        shift_id=body.shift_id,
        rider_id=body.rider_id,
        scoring=scoring,
        decision=decision,
        payout=payout,
        evaluated_at=evaluated_at.isoformat(),
    )


@router.get("/{claim_id}/status", response_model=ClaimStatusResponse)
async def get_claim_status(claim_id: str):
    db  = get_db()
    doc = await db.claims.find_one({"claim_id": claim_id})
    if not doc:
        raise HTTPException(status_code=404, detail=f"Claim {claim_id} not found")

    return ClaimStatusResponse(
        claim_id=doc["claim_id"],
        rider_id=doc["rider_id"],
        decision=doc["decision"],
        confidence_score=doc["confidence_score"],
        payout_amount=doc["final_amount"] if doc["eligible"] else None,
        transfer_status=doc["transfer_status"],
        evaluated_at=doc["evaluated_at"].isoformat(),
    )


@router.get("/rider/{rider_id}")
async def get_rider_claims(rider_id: str, limit: int = 10):
    db     = get_db()
    cursor = db.claims.find({"rider_id": rider_id}).sort("evaluated_at", -1).limit(limit)
    claims = []
    async for doc in cursor:
        claims.append({
            "claim_id":         doc["claim_id"],
            "shift_id":         doc["shift_id"],
            "decision":         doc["decision"],
            "confidence_score": doc["confidence_score"],
            "final_amount":     doc["final_amount"],
            "transfer_status":  doc["transfer_status"],
            "evaluated_at":     doc["evaluated_at"].isoformat(),
        })
    return {"rider_id": rider_id, "total": len(claims), "claims": claims}