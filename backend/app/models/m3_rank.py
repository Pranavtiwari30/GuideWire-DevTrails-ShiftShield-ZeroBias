import hashlib
import math
from app.schemas import RankSignal


def _rider_seed(rider_id: str, salt: int = 17) -> float:
    h = int(hashlib.md5(f"{rider_id}{salt}".encode()).hexdigest(), 16)
    return (h % 100_000) / 100_000.0


def _sv(seed: float, offset: float) -> float:
    return abs(math.sin(seed * 3_571 + offset * 8_221 + 43))


def run_rank_monitor(
    rider_id: str,
    weather_score: float,
    activity_score: float,
) -> RankSignal:
    seed = _rider_seed(rider_id)

    rank_before = int(50 + _sv(seed, 1) * 49)

    disruption_factor = min((weather_score + activity_score) / 200.0, 1.0)
    rank_drop_pct = round(disruption_factor * 48 + _sv(seed, 2) * 8, 1)

    rank_current = max(1, int(rank_before * (1 - rank_drop_pct / 100)))

    if rank_drop_pct > 30:
        score = 78 + _sv(seed, 3) * 22
    elif rank_drop_pct > 15:
        score = 48 + _sv(seed, 3) * 30
    elif rank_drop_pct > 5:
        score = 18 + _sv(seed, 3) * 30
    else:
        score = _sv(seed, 3) * 18

    score     = round(min(score, 100.0), 2)
    triggered = rank_drop_pct > 15

    details = (
        f"Rider {rider_id}: rank {rank_before} → {rank_current} "
        f"({rank_drop_pct}% drop during shift window)"
        if triggered
        else f"Rider {rider_id}: rank stable {rank_before} → {rank_current} "
             f"({rank_drop_pct}% — within normal variance)"
    )

    return RankSignal(
        rider_id=rider_id,
        rank_before=rank_before,
        rank_current=rank_current,
        rank_drop_pct=rank_drop_pct,
        score=score,
        triggered=triggered,
        details=details,
    )