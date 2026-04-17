function getCompetitorFactor(basePrice, competitorPrices) {
  if (!competitorPrices || competitorPrices.length === 0) return 1.0;
  const avg = competitorPrices.reduce((sum, cp) => sum + cp.price, 0) / competitorPrices.length;
  if (basePrice > avg * 1.1) return 0.95;
  if (basePrice < avg * 0.9) return 1.05;
  return 1.0;
}
module.exports = { getCompetitorFactor };
