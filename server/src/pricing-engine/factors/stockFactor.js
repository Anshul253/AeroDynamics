function getStockFactor(quantity, lowStockThreshold) {
  if (!lowStockThreshold || lowStockThreshold === 0) return 1.0;
  const ratio = quantity / lowStockThreshold;
  if (ratio > 3.0) return 0.85;
  if (ratio > 1.5) return 0.95;
  if (ratio > 1.0) return 1.00;
  if (ratio > 0.5) return 1.15;
  return 1.30;
}
module.exports = { getStockFactor };
