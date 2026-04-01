import hashlib
import math
import os
import requests
from dotenv import load_dotenv

from app.schemas import WeatherSignal, WeatherSeverity

load_dotenv()

API_KEY = os.getenv("OPENWEATHER_API_KEY")


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


def fetch_weather_from_api(pincode: str):

    url = f"http://api.openweathermap.org/data/2.5/weather?zip={pincode},IN&appid={API_KEY}&units=metric"

    try:
        response = requests.get(url, timeout=5)

        if response.status_code != 200:
            return 0.0, 0.0, 50

        data = response.json()

        rainfall_mm = 0.0
        if "rain" in data:
            rainfall_mm = data["rain"].get("1h", 0.0)

        wind_speed_kmh = data["wind"]["speed"] * 3.6   # convert m/s to km/h

        aqi = 50   # placeholder until CPCB AQI API added

        return round(rainfall_mm, 1), round(wind_speed_kmh, 1), int(aqi)

    except:
        return 0.0, 0.0, 50


def run_weather_engine(pincode: str) -> WeatherSignal:

    rainfall_mm, wind_speed_kmh, aqi = fetch_weather_from_api(pincode)

    severity = _classify_severity(rainfall_mm, wind_speed_kmh, aqi)

    lo, hi = _SEVERITY_SCORE_RANGE[severity]

    # generate stable score within severity range
    seed = int(hashlib.md5(pincode.encode()).hexdigest(), 16) % 1000 / 1000
    score = round(lo + seed * (hi - lo), 2)

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