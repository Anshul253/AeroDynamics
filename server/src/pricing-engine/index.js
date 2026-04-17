const { getDemandFactor } = require("./factors/demandFactor");
const { getStockFactor } = require("./factors/stockFactor");
const { getTimeFactor } = require("./factors/timeFactor");
const { getCompetitorFactor } = require("./factors/competitorFactor");
const { getLoyaltyDiscount } = require("./factors/loyaltyFactor");

function calculateDynamicPrice({ product, inventory, demand, competitorPrices, user }) {
  const demandFactor = getDemandFactor(demand);
  const stockFactor = getStockFactor(inventory?.quantity ?? 0, inventory?.lowStockThreshold ?? 10);
  const timeFactor = getTimeFactor();
  const competitorFactor = getCompetitorFactor(product.basePrice, competitorPrices);
  const loyaltyDiscount = getLoyaltyDiscount(user?.totalOrders ?? 0);

  let finalPrice = product.basePrice * demandFactor * stockFactor * timeFactor * competitorFactor * loyaltyDiscount;
  finalPrice = Math.max(product.floorPrice, Math.min(product.basePrice, finalPrice));
  finalPrice = Math.round(finalPrice * 100) / 100;

  return {
    finalPrice,
    factors: { demandFactor, stockFactor, timeFactor, competitorFactor, loyaltyDiscount },
    basePrice: product.basePrice,
  };
}

module.exports = { calculateDynamicPrice };
