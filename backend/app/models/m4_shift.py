from datetime import datetime, timezone
from app.schemas import ShiftSignal, ShiftType

_HOURLY_RATES: dict[ShiftType, tuple[float, float]] = {
    "MORNING":   (80,  120),
    "AFTERNOON": (90,  130),
    "EVENING":   (120, 180),
    "NIGHT":     (70,  100),
}

def _classify_shift(hour: int) -> ShiftType:
    if 6  <= hour < 12: return "MORNING"
    if 12 <= hour < 17: return "AFTERNOON"
    if 17 <= hour < 22: return "EVENING"
    return "NIGHT"


def run_shift_classifier(rider_id: str, shift_start: str) -> ShiftSignal:
    try:
        start_dt = datetime.fromisoformat(shift_start.replace("Z", "+00:00"))
    except ValueError:
        start_dt = datetime.now(timezone.utc)

    now = datetime.now(timezone.utc)
    if start_dt.tzinfo is None:
        start_dt = start_dt.replace(tzinfo=timezone.utc)

    shift_type  = _classify_shift(start_dt.hour)
    lo, hi      = _HOURLY_RATES[shift_type]
    hourly_rate = (lo + hi) / 2

    raw_hours = (now - start_dt).total_seconds() / 3600
    if raw_hours < 0.02:
        raw_hours = 2.0
    hours_active = round(min(raw_hours, 8.0), 2)

    expected_earnings = round(hourly_rate * max(hours_active, 1.0), 2)

    if hours_active >= 3:
        score = min(75 + (hours_active - 3) * 5, 100)
    elif hours_active >= 1:
        score = 40 + hours_active * 15
    else:
        score = 15 + hours_active * 25

    if shift_type == "EVENING":
        score = min(score * 1.1, 100)

    score     = round(score, 2)
    triggered = hours_active >= 1 and score >= 40

    details = (
        f"Rider {rider_id}: {shift_type} shift — {hours_active:.1f}hrs active, "
        f"expected ₹{expected_earnings:.0f}"
        if triggered
        else f"Rider {rider_id}: shift too early for coverage ({hours_active:.1f}hrs active)"
    )

    return ShiftSignal(
        rider_id=rider_id,
        shift_start=shift_start,
        shift_type=shift_type,
        hours_active=hours_active,
        expected_earnings=expected_earnings,
        score=score,
        triggered=triggered,
        details=details,
    )