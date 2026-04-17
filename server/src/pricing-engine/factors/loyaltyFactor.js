function getLoyaltyDiscount(totalOrders) {
  if (totalOrders >= 20) return 0.90;
  if (totalOrders >= 10) return 0.93;
  if (totalOrders >= 5) return 0.95;
  if (totalOrders >= 1) return 0.98;
  return 1.00;
}
module.exports = { getLoyaltyDiscount };
