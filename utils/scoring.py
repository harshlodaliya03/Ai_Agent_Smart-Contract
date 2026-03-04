def calculate_risk(slither_output):

    score = 100

    if "Reentrancy" in slither_output:
        score -= 30
    if "Low level call" in slither_output:
        score -= 20
    if "Unchecked" in slither_output:
        score -= 10

    return max(score, 0)