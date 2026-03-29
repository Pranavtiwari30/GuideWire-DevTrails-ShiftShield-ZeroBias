import hashlib
import math
from app.schemas import ActivitySignal


def _rider_seed(rider_id: str) -> float:
    h = int(hashlib.sha256(rider_id.encode()).hexdigest(), 16)
    return (h % 100_000) / 100_000.0


def _sv(seed: float, offset: float) -> float:
    return abs(math.sin(seed * 7_919 + offset * 1_301 + 17))


def run_activity_validator(
    rider_id: str,
    weather_score: float,
    disruption_score: float,
) -> ActivitySignal:
    seed = _rider_seed(rider_id)

    disruption_factor = min((weather_score + disruption_score) / 200.0, 1.0)

    last_ping        = int(5 + disruption_factor * 90 + _sv(seed, 1) * 15)
    orders_attempted = int((1 - disruption_factor * 0.85) * _sv(seed, 2) * 9)
    orders_completed = int(orders_attempted * max(0, 1 - disruption_factor * 0.7))
    completion_rate  = round(orders_completed / orders_attempted, 2) if orders_attempted > 0 else 0.0

    score = 0.0
    if last_ping > 60:        score += 40
    elif last_ping > 30:      score += 20

    if orders_attempted == 0:   score += 30
    elif orders_attempted <= 2: score += 15

    if completion_rate < 0.3:   score += 30
    elif completion_rate < 0.6: score += 15

    score     = round(min(score, 100.0), 2)
    triggered = score >= 50

    details = (
        f"Rider {rider_id}: offline gap {last_ping}min, "
        f"{orders_completed}/{orders_attempted} orders ({int(completion_rate*100)}% completion)"
        if triggered
        else f"Rider {rider_id}: active — {orders_attempted} orders, {last_ping}min since last ping"
    )

    return ActivitySignal(
        rider_id=rider_id,
        last_app_ping_minutes_ago=last_ping,
        orders_attempted=orders_attempted,
        orders_completed=orders_completed,
        completion_rate=completion_rate,
        score=score,
        triggered=triggered,
        details=details,
    )