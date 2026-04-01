import hashlib
import math
from datetime import date
from typing import Optional
from app.schemas import DisruptionSignal, DisruptionType


def _disruption_seed(pincode: str, today: date) -> float:
    key = f"{pincode}{today.isoformat()}"
    h   = int(hashlib.sha256(key.encode()).hexdigest(), 16)
    return (h % 100_000) / 100_000.0


_DISRUPTION_TABLE = [
    (0.20, "BANDH",   3, "govt_advisory"),
    (0.30, "PROTEST", 2, "local_news_feed"),
    (0.35, "CURFEW",  3, "state_police_order"),
]

_SEVERITY_SCORE: dict[int, tuple[float, float]] = {
    1: (25.0, 45.0),
    2: (50.0, 72.0),
    3: (78.0, 100.0),
}

_TYPE_LABELS: dict[DisruptionType, str] = {
    "BANDH":   "Bandh declared",
    "CURFEW":  "Curfew in effect",
    "PROTEST": "Active protest / road blockage",
    "NONE":    "No disruption",
}


def run_disruption_detector(pincode: str) -> DisruptionSignal:
    today = date.today()
    seed  = _disruption_seed(pincode, today)

    event: Optional[tuple] = None
    for threshold, d_type, severity, source in _DISRUPTION_TABLE:
        if seed < threshold:
            event = (d_type, severity, source)
            break

    if event is None:
        return DisruptionSignal(
            pincode=pincode,
            disruption_type="NONE",
            source="simulated",
            severity_level=1,
            score=round(seed * 20, 2),
            triggered=False,
            details=f"No active social disruption events found for pincode {pincode}",
        )

    d_type, severity, source = event
    lo, hi = _SEVERITY_SCORE[severity]
    score_seed = abs(math.sin(seed * 12_301 + severity * 4_421))
    score = round(lo + score_seed * (hi - lo), 2)

    details = (
        f"Pincode {pincode}: {_TYPE_LABELS[d_type]} — "
        f"severity {severity}/3, source: {source}"
    )

    return DisruptionSignal(
        pincode=pincode,
        disruption_type=d_type,
        source=source,
        severity_level=severity,
        score=score,
        triggered=True,
        details=details,
    )