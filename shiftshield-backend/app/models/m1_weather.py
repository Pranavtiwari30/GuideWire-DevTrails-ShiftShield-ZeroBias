import hashlib
import math
from app.schemas import WeatherSignal, WeatherSeverity


def _pincode_seed(pincode: str) -> float:
    h = int(hashlib.md5(pincode.encode()).hexdigest(), 16)
    return h % 100_000 / 100_000.0


def _seeded_val(seed: float, offset: float, scale: float) -> float:
    return abs(math.sin(seed * 9_301 + offset * 49_297 + 233)) * scale


def _classify_severity(rainfall: float, wind: float, aqi: int) -> WeatherSeverity:
    if rainfall > 50 or aqi > 400 or wind > 80:
        return "EXTREME"
    if rainfall > 15 or aqi > 300 or wind > 50:
        return "SEVERE"
    if rainfall > 5 or aqi > 150 or wind > 30:
        return "MODERATE"
    return "CLEAR"


_SEVERITY_SCORE_RANGE: dict[WeatherSeverity, tuple[float, float]] = {
    "EXTREME":  (88.0, 100.0),
    "SEVERE":   (65.0, 87.0),
    "MODERATE": (35.0, 64.0),
    "CLEAR":    (0.0,  34.0),
}


def run_weather_engine(pincode: str) -> WeatherSignal:
    seed = _pincode_seed(pincode)

    rainfall_mm    = round(_seeded_val(seed, 1.0, 65.0), 1)
    wind_speed_kmh = round(_seeded_val(seed, 2.0, 95.0), 1)
    aqi            = int(_seeded_val(seed, 3.0, 500.0))

    severity = _classify_severity(rainfall_mm, wind_speed_kmh, aqi)
    lo, hi   = _SEVERITY_SCORE_RANGE[severity]
    score    = round(lo + _seeded_val(seed, 4.0, 1.0) * (hi - lo), 2)
    triggered = severity in ("SEVERE", "EXTREME")

    details = (
        f"Pincode {pincode}: {severity} — {rainfall_mm}mm/hr rain, "
        f"AQI {aqi}, wind {wind_speed_kmh}km/h"
        if triggered
        else f"Pincode {pincode}: {severity} — within normal delivery operating range"
    )

    return WeatherSignal(
        pincode=pincode,
        rainfall_mm=rainfall_mm,
        wind_speed_kmh=wind_speed_kmh,
        aqi=aqi,
        severity=severity,
        score=score,
        triggered=triggered,
        details=details,
    )