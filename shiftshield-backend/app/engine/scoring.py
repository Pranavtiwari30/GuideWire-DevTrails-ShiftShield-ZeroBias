import asyncio
from functools import lru_cache
import os
import joblib
import numpy as np

from app.config import settings
from app.schemas import IndividualScores, ModelWeights, SignalBundle, ScoringResult
from app.models.m1_weather    import run_weather_engine
from app.models.m2_activity   import run_activity_validator
from app.models.m3_rank       import run_rank_monitor
from app.models.m4_shift      import run_shift_classifier
from app.models.m5_disruption import run_disruption_detector

WEIGHTS = ModelWeights(m1=0.20, m2=0.30, m3=0.20, m4=0.15, m5=0.15)


@lru_cache(maxsize=1)
def _load_model():
    path = settings.model_path
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Model not found at '{path}'. Run: python -m scripts.train_model"
        )
    clf = joblib.load(path)
    print(f"[ScoringEngine] Model loaded from {path}")
    return clf


def _sklearn_score(feature_vector: list[float]) -> float:
    clf = _load_model()
    X   = np.array(feature_vector, dtype=np.float32).reshape(1, -1)
    prob: float = clf.predict_proba(X)[0][1]
    return round(float(prob), 6)


async def run_scoring_engine(
    rider_id: str,
    pincode: str,
    shift_start: str,
) -> ScoringResult:

    # Step 1: environment signals — no rider dependency, run together
    m1, m5 = await asyncio.gather(
        asyncio.to_thread(run_weather_engine, pincode),
        asyncio.to_thread(run_disruption_detector, pincode),
    )

    # Step 2: activity cross-validates environment
    m2 = await asyncio.to_thread(run_activity_validator, rider_id, m1.score, m5.score)

    # Step 3: rank drop should correlate with activity drop
    m3 = await asyncio.to_thread(run_rank_monitor, rider_id, m1.score, m2.score)

    # Step 4: shift timing — independent
    m4 = await asyncio.to_thread(run_shift_classifier, rider_id, shift_start)

    signals = SignalBundle(
        m1_weather=m1,
        m2_activity=m2,
        m3_rank=m3,
        m4_shift=m4,
        m5_disruption=m5,
    )

    individual_scores = IndividualScores(
        m1=m1.score, m2=m2.score, m3=m3.score, m4=m4.score, m5=m5.score
    )

    feature_vector = [m1.score, m2.score, m3.score, m4.score, m5.score]

    ml_raw_score     = _sklearn_score(feature_vector)
    confidence_score = round(ml_raw_score * 100, 2)

    triggered_flags   = [m1.triggered, m2.triggered, m3.triggered, m4.triggered, m5.triggered]
    signals_triggered = sum(triggered_flags)
    all_five_triggered = signals_triggered == 5

    return ScoringResult(
        signals=signals,
        individual_scores=individual_scores,
        weights=WEIGHTS,
        confidence_score=confidence_score,
        signals_triggered=signals_triggered,
        all_five_triggered=all_five_triggered,
        feature_vector=feature_vector,
        ml_raw_score=ml_raw_score,
    )