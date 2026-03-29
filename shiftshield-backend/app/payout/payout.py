import uuid
from datetime import datetime, timezone
from app.schemas import ScoringResult, DecisionResult, PayoutResult, ShiftType, DisruptionType

_HOURLY_RATES: dict[ShiftType, float] = {
    "MORNING":   100.0,
    "AFTERNOON": 110.0,
    "EVENING":   150.0,
    "NIGHT":     85.0,
}

_DISRUPTION_MULTIPLIERS: dict[DisruptionType, float] = {
    "CURFEW":  1.8,
    "BANDH":   1.5,
    "PROTEST": 1.2,
    "NONE":    1.0,
}

MAX_PAYOUT = 800.0
MIN_PAYOUT = 50.0
STANDARD_SHIFT_HRS = 6.0


def run_payout_engine(scoring: ScoringResult, decision: DecisionResult) -> PayoutResult:

    if decision.decision == "AUTO_REJECTED":
        return PayoutResult(
            eligible=False,
            base_amount=0.0,
            disruption_multiplier=1.0,
            final_amount=0.0,
            upi_ref=None,
            transfer_status="REJECTED",
            notified=True,
        )

    shift      = scoring.signals.m4_shift
    disruption = scoring.signals.m5_disruption

    hourly_rate     = _HOURLY_RATES[shift.shift_type]
    hours_remaining = max(0.0, STANDARD_SHIFT_HRS - shift.hours_active)
    base_amount     = round(hourly_rate * max(hours_remaining, 1.0), 2)

    multiplier   = _DISRUPTION_MULTIPLIERS[disruption.disruption_type]
    raw_amount   = base_amount * multiplier
    final_amount = round(min(max(raw_amount, MIN_PAYOUT), MAX_PAYOUT), 2)

    if decision.decision == "AUTO_APPROVED":
        upi_ref = f"SS{int(datetime.now(timezone.utc).timestamp())}-{uuid.uuid4().hex[:8].upper()}"
        print(f"[Payout] Mock UPI: ₹{final_amount} → ref {upi_ref}")
        return PayoutResult(
            eligible=True,
            base_amount=base_amount,
            disruption_multiplier=multiplier,
            final_amount=final_amount,
            upi_ref=upi_ref,
            transfer_status="COMPLETED",
            notified=True,
        )

    # FLAGGED — hold until manual review
    return PayoutResult(
        eligible=True,
        base_amount=base_amount,
        disruption_multiplier=multiplier,
        final_amount=final_amount,
        upi_ref=None,
        transfer_status="PENDING_REVIEW",
        notified=True,
    )