from __future__ import annotations

import os
from datetime import datetime, timezone
from functools import lru_cache
from typing import Any

import joblib
import numpy as np
import pandas as pd

from app.schemas import ShiftSignal, ShiftType



_MODEL_PATH = os.getenv("SHIFT_MODEL_PATH", "app/engine/shift_model.joblib")


# Baseline configs 
_BASE_OPH = {
    "MORNING": 2.1,
    "AFTERNOON": 3.4,
    "EVENING": 5.2,
    "NIGHT": 1.6,
}

_ZONE_OM = {
    "metro_core": 1.40,
    "metro_suburb": 1.10,
    "tier2_city": 0.85,
    "residential": 0.75,
    "industrial": 0.60,
}

BASE_EPO = 42  # avg earnings per order



@lru_cache(maxsize=1)
def _load_model() -> dict[str, Any]:
    if not os.path.exists(_MODEL_PATH):
        raise FileNotFoundError(f"Model not found at {_MODEL_PATH}")
    return joblib.load(_MODEL_PATH)


def _classify_shift(hour: int) -> ShiftType:
    if 6 <= hour < 12: return "MORNING"
    if 12 <= hour < 17: return "AFTERNOON"
    if 17 <= hour < 22: return "EVENING"
    return "NIGHT"


# Feature Builder
def _build_feature_row(
    *,
    hour: int,
    day_of_week: int,
    shift_type: ShiftType,
    zone_type: str,
    weather_flag: int,
    active_hours: float,
    avg_orders_per_shift: float,
    past_3_shift_avg: float,
    consistency_score: float,
):
    m = _load_model()

    past_demand_intensity = past_3_shift_avg / max(active_hours, 0.5)

    expected_orders_baseline = (
        _BASE_OPH.get(shift_type, 3.0)
        * _ZONE_OM.get(zone_type, 1.0)
        * active_hours
    )

    is_disrupted = 1 if weather_flag == 2 else 0

    missed_bonus = 1 if (
        expected_orders_baseline >= 10 and weather_flag == 2
    ) else 0

    row = {
        "hour": hour,
        "day_of_week": day_of_week,
        "shift_type_enc": int(m["le_shift"].transform([shift_type])[0]),
        "zone_type_enc": int(m["le_zone"].transform([zone_type])[0]),
        "weather_flag": weather_flag,
        "active_hours": active_hours,
        "avg_orders_per_shift": avg_orders_per_shift,
        "past_3_shift_avg": past_3_shift_avg,
        "consistency_score": consistency_score,
        "past_demand_intensity": past_demand_intensity,
        "expected_orders_baseline": expected_orders_baseline,
        "is_disrupted": is_disrupted,
        "missed_bonus": missed_bonus,
    }

    return pd.DataFrame([row])[m["features"]], expected_orders_baseline



def _predict(feature_df: pd.DataFrame):
    m = _load_model()
    orders = float(m["model_orders"].predict(feature_df)[0])
    earnings = float(m["model_earnings"].predict(feature_df)[0])
    demand = float(m["model_demand"].predict(feature_df)[0])
    return max(orders, 0), max(earnings, 0), max(demand, 0)


#  MAIN FUNCTION 
def run_shift_classifier(
    rider_id: str,
    shift_start: str,
    *,
    zone_type: str = "metro_suburb",
    weather_flag: int = 0,
    avg_orders_per_shift: float = 12.0,
    past_3_shift_avg: float = 11.5,
    consistency_score: float = 55.0,
) -> ShiftSignal:

  
    try:
        start_dt = datetime.fromisoformat(shift_start.replace("Z", "+00:00"))
    except:
        start_dt = datetime.now(timezone.utc)

    if start_dt.tzinfo is None:
        start_dt = start_dt.replace(tzinfo=timezone.utc)

    now = datetime.now(timezone.utc)

    shift_type = _classify_shift(start_dt.hour)
    day_of_week = start_dt.weekday()
    hour = start_dt.hour

    raw_hours = (now - start_dt).total_seconds() / 3600
    active_hours = round(float(np.clip(raw_hours if raw_hours >= 0.02 else 2.0, 0.1, 8.0)), 2)


    try:
        feature_df, expected_orders_baseline = _build_feature_row(
            hour=hour,
            day_of_week=day_of_week,
            shift_type=shift_type,
            zone_type=zone_type,
            weather_flag=weather_flag,
            active_hours=active_hours,
            avg_orders_per_shift=avg_orders_per_shift,
            past_3_shift_avg=past_3_shift_avg,
            consistency_score=consistency_score,
        )

        orders_pred, earnings_pred, demand_pred = _predict(feature_df)
        baseline_earnings = expected_orders_baseline * BASE_EPO

        ml_available = True

    except FileNotFoundError:
        earnings_pred = 100 * active_hours
        orders_pred = earnings_pred / 42
        demand_pred = orders_pred / max(active_hours, 0.5)
        baseline_earnings = earnings_pred
        ml_available = False

    # LOSS-BASED TRIGGER 
    income_loss = max(baseline_earnings - earnings_pred, 0)

    loss_percent = (
        income_loss / baseline_earnings
        if baseline_earnings > 0 else 0
    )

    triggered = (
        active_hours >= 1 and
        loss_percent >= 0.25
    )

    # Score 
    score = min(100, round(50 + loss_percent * 100, 2))

   
    model_tag = "[ML]" if ml_available else "[fallback]"
    weather_map = {0: "☀️ clear", 1: "🌧 light rain", 2: "⛈ heavy rain"}

    details = (
        f"{model_tag} Rider {rider_id}: {shift_type} | "
        f"{active_hours:.1f} hrs | "
        f"{orders_pred:.0f} orders | "
        f"₹{earnings_pred:.0f} earned | "
        f"Loss ₹{income_loss:.0f} ({loss_percent*100:.0f}%) | "
        f"{weather_map.get(weather_flag, 'unknown weather')}"
    )

    return ShiftSignal(
        rider_id=rider_id,
        shift_start=shift_start,
        shift_type=shift_type,
        hours_active=active_hours,
        expected_earnings=round(earnings_pred, 2),
        score=score,
        triggered=triggered,
        details=details,
    )