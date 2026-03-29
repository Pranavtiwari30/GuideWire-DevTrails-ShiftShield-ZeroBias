from __future__ import annotations
from typing import Literal, Optional
from pydantic import BaseModel, Field

# ─── Enums ───────────────────────────────────────────────────────────────────

ClaimDecision   = Literal["AUTO_APPROVED", "FLAGGED_FOR_REVIEW", "AUTO_REJECTED"]
ShiftStatus     = Literal["ACTIVE", "ENDED"]
DisruptionType  = Literal["BANDH", "CURFEW", "PROTEST", "NONE"]
WeatherSeverity = Literal["CLEAR", "MODERATE", "SEVERE", "EXTREME"]
ShiftType       = Literal["MORNING", "AFTERNOON", "EVENING", "NIGHT"]
TransferStatus  = Literal["COMPLETED", "PENDING_REVIEW", "REJECTED"]

# ─── Sub-Model Signal Outputs ─────────────────────────────────────────────────

class WeatherSignal(BaseModel):
    pincode: str
    rainfall_mm: float
    wind_speed_kmh: float
    aqi: int
    severity: WeatherSeverity
    score: float = Field(ge=0, le=100)
    triggered: bool
    details: str

class ActivitySignal(BaseModel):
    rider_id: str
    last_app_ping_minutes_ago: int
    orders_attempted: int
    orders_completed: int
    completion_rate: float = Field(ge=0, le=1)
    score: float = Field(ge=0, le=100)
    triggered: bool
    details: str

class RankSignal(BaseModel):
    rider_id: str
    rank_before: int
    rank_current: int
    rank_drop_pct: float
    score: float = Field(ge=0, le=100)
    triggered: bool
    details: str

class ShiftSignal(BaseModel):
    rider_id: str
    shift_start: str
    shift_type: ShiftType
    hours_active: float
    expected_earnings: float
    score: float = Field(ge=0, le=100)
    triggered: bool
    details: str

class DisruptionSignal(BaseModel):
    pincode: str
    disruption_type: DisruptionType
    source: str
    severity_level: Literal[1, 2, 3]
    score: float = Field(ge=0, le=100)
    triggered: bool
    details: str

# ─── Aggregated Scoring ───────────────────────────────────────────────────────

class SignalBundle(BaseModel):
    m1_weather: WeatherSignal
    m2_activity: ActivitySignal
    m3_rank: RankSignal
    m4_shift: ShiftSignal
    m5_disruption: DisruptionSignal

class IndividualScores(BaseModel):
    m1: float
    m2: float
    m3: float
    m4: float
    m5: float

class ModelWeights(BaseModel):
    m1: float
    m2: float
    m3: float
    m4: float
    m5: float

class ScoringResult(BaseModel):
    signals: SignalBundle
    individual_scores: IndividualScores
    weights: ModelWeights
    confidence_score: float = Field(ge=0, le=100)
    signals_triggered: int = Field(ge=0, le=5)
    all_five_triggered: bool
    feature_vector: list[float]
    ml_raw_score: float

class DecisionResult(BaseModel):
    decision: ClaimDecision
    confidence_score: float
    reason: str
    requires_manual_review: bool

class PayoutResult(BaseModel):
    eligible: bool
    base_amount: float
    disruption_multiplier: float
    final_amount: float
    upi_ref: Optional[str]
    transfer_status: TransferStatus
    notified: bool

# ─── API Request / Response Shapes ───────────────────────────────────────────

class StartShiftRequest(BaseModel):
    rider_id: str
    pincode: str
    shift_start: Optional[str] = None

class StartShiftResponse(BaseModel):
    shift_id: str
    rider_id: str
    pincode: str
    shift_start: str
    status: ShiftStatus
    message: str

class EvaluateClaimRequest(BaseModel):
    shift_id: str
    rider_id: str
    pincode: str
    shift_start: str

class EvaluateClaimResponse(BaseModel):
    claim_id: str
    shift_id: str
    rider_id: str
    scoring: ScoringResult
    decision: DecisionResult
    payout: PayoutResult
    evaluated_at: str

class ClaimStatusResponse(BaseModel):
    claim_id: str
    rider_id: str
    decision: ClaimDecision
    confidence_score: float
    payout_amount: Optional[float]
    transfer_status: str
    evaluated_at: str