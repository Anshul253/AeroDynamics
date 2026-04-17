function getDemandFactor(demand) {
  if (!demand) return 1.0;
  const score = (demand.viewCount1h || 0) * 1 + (demand.purchaseCount1h || 0) * 5;
  if (score <= 10) return 0.90;
  if (score <= 30) return 1.00;
  if (score <= 60) return 1.10;
  if (score <= 100) return 1.20;
  return 1.30;
}
module.exports = { getDemandFactor };
