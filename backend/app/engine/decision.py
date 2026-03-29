from app.schemas import ScoringResult, DecisionResult


def make_decision(scoring: ScoringResult) -> DecisionResult:
    score     = scoring.confidence_score
    triggered = scoring.signals_triggered
    all_five  = scoring.all_five_triggered

    if score < 40 or triggered < 3:
        return DecisionResult(
            decision="AUTO_REJECTED",
            confidence_score=score,
            reason=_reason("REJECTED", score, triggered, all_five),
            requires_manual_review=False,
        )

    if score >= 75 and all_five:
        return DecisionResult(
            decision="AUTO_APPROVED",
            confidence_score=score,
            reason=_reason("APPROVED", score, triggered, all_five),
            requires_manual_review=False,
        )

    return DecisionResult(
        decision="FLAGGED_FOR_REVIEW",
        confidence_score=score,
        reason=_reason("FLAGGED", score, triggered, all_five),
        requires_manual_review=True,
    )


def _reason(outcome: str, score: float, triggered: int, all_five: bool) -> str:
    if outcome == "APPROVED":
        return (
            f"All 5 signals corroborated — ML confidence {score:.1f}/100. "
            "Weather, activity, rank, shift timing, and social disruption "
            "all confirm income loss. Payout auto-approved."
        )
    if outcome == "REJECTED":
        if triggered < 3:
            return (
                f"Only {triggered}/5 signals triggered (minimum 3 required). "
                "Insufficient corroboration — claim does not meet parametric "
                "threshold. Auto-rejected."
            )
        return (
            f"ML confidence score {score:.1f}/100 is below the 40-point minimum. "
            "Claim does not meet parametric criteria. Auto-rejected."
        )
    if not all_five:
        return (
            f"{triggered}/5 signals triggered — ML confidence {score:.1f}/100. "
            "Score meets threshold but cross-validation incomplete. "
            "Flagged for manual review."
        )
    return (
        f"ML confidence {score:.1f}/100 falls in the review band (40–75). "
        "Claim requires manual adjudication before payout."
    )