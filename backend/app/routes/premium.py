from fastapi import APIRouter, HTTPException
from app.database import get_db
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/premium", tags=["Premium"])

# Base weekly premiums by zone
_ZONE_BASE = {
    "metro_core":   49,
    "metro_suburb": 39,
    "tier2":        29,
    "rural":        19,
}

# Risk multipliers
_VEHICLE_RISK = {
    "bike":     1.0,
    "cycle":    0.85,
    "scooter":  1.1,
    "car":      1.2,
}

_DISRUPTION_RISK = {
    "HIGH":   1.3,   # pincode had frequent disruptions
    "MEDIUM": 1.1,
    "LOW":    1.0,
}

class PremiumQuoteRequest(BaseModel):
    rider_id: Optional[str] = None
    zone_type: str = "metro_suburb"
    vehicle_type: str = "bike"
    pincode: str
    coverage_days: int = 7   # 1, 3, or 7

@router.post("/quote")
async def get_premium_quote(body: PremiumQuoteRequest):
    if body.coverage_days not in [1, 3, 7]:
        raise HTTPException(status_code=400, detail="coverage_days must be 1, 3, or 7")
    if not body.pincode.isdigit() or len(body.pincode) != 6:
        raise HTTPException(status_code=400, detail="pincode must be 6 digits")

    # Get zone from rider profile if rider_id provided
    zone_type = body.zone_type
    if body.rider_id:
        db     = get_db()
        rider  = await db.riders.find_one({"rider_id": body.rider_id})
        if rider:
            zone_type = rider.get("zone_type", body.zone_type)

    base_weekly     = _ZONE_BASE.get(zone_type, 39)
    vehicle_mult    = _VEHICLE_RISK.get(body.vehicle_type, 1.0)

    # Pincode risk — derive from seed (replace with historical claim data later)
    pincode_seed    = sum(int(d) for d in body.pincode) % 3
    disruption_tier = ["LOW", "MEDIUM", "HIGH"][pincode_seed]
    disruption_mult = _DISRUPTION_RISK[disruption_tier]

    # Scale to coverage days
    daily_rate      = base_weekly / 7
    raw_premium     = daily_rate * body.coverage_days * vehicle_mult * disruption_mult

    final_premium   = max(round(raw_premium, 2), 2.0)  # minimum ₹2

    # Max payout rider is eligible for
    max_payout = {1: 200, 3: 450, 7: 800}[body.coverage_days]

    return {
        "rider_id":        body.rider_id,
        "pincode":         body.pincode,
        "zone_type":       zone_type,
        "vehicle_type":    body.vehicle_type,
        "coverage_days":   body.coverage_days,
        "disruption_tier": disruption_tier,
        "base_weekly_inr": base_weekly,
        "premium_inr":     final_premium,
        "max_payout_inr":  max_payout,
        "breakdown": {
            "base_daily":        round(daily_rate, 2),
            "vehicle_multiplier": vehicle_mult,
            "risk_multiplier":   disruption_mult,
        },
        "message": f"Coverage for {body.coverage_days} day(s): ₹{final_premium} premium, up to ₹{max_payout} payout.",
    }