def decide_on_claim(score):
    if score >= 75:
        return "approve"
    elif 40 <= score < 75:
        return "flag"
    else:
        return "reject"
