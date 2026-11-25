// scoring.js — money, tips, combos and stars.
// A served dish pays its price plus a tip for speed. Serving in a row builds
// a combo multiplier; a missed ticket or a burnt pan resets it. Rush hour pays
// a 25% bonus on top. All numbers live here so the HUD and the end screen agree.

export function createScore() {
  return {
    total: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    expired: 0,
    burnt: 0,
    earnedThisLevel: 0,
  };
}

// Price + speed tip, then the combo multiplier. Returns the breakdown so the
// renderer can float "+180 · 小费 40 · 连击 x3" over the pass.
export function scoreServe(score, order, rush) {
  const timeRatio = order.timeLeft / order.timeMax;
  const tip = Math.round(order.price * 0.5 * timeRatio);
  const comboBefore = score.combo;
  score.combo += 1;
  score.bestCombo = Math.max(score.bestCombo, score.combo);
  const comboMult = 1 + Math.min(score.combo - 1, 4) * 0.25; // x1.00 .. x2.00
  const rushMult = rush ? 1.25 : 1;
  const base = order.price + tip;
  const earned = Math.round(base * comboMult * rushMult);
  score.total += earned;
  score.earnedThisLevel += earned;
  score.served += 1;
  return { earned, tip, combo: score.combo, comboMult, rushMult, base };
}

export function scoreExpired(score) {
  score.combo = 0;
  score.expired += 1;
  const penalty = 50;
  score.total = Math.max(0, score.total - penalty);
  score.earnedThisLevel = Math.max(0, score.earnedThisLevel - penalty);
  return penalty;
}

export function scoreBurnt(score) {
  score.combo = 0;
  score.burnt += 1;
  return 0;
}

export function resetCombo(score) {
  score.combo = 0;
}

export function comboLabel(score) {
  return score.combo >= 2 ? `x${score.combo} 连击` : '';
}
