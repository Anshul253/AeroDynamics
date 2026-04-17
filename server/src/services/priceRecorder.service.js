const prisma = require("../config/prisma");

async function recordPrice(productId, pricing) {
  await prisma.priceHistory.create({
    data: {
      productId,
      price: pricing.finalPrice,
      basePrice: pricing.basePrice,
      demandFactor: pricing.factors.demandFactor,
      stockFactor: pricing.factors.stockFactor,
      timeFactor: pricing.factors.timeFactor,
      competitorFactor: pricing.factors.competitorFactor,
      loyaltyDiscount: pricing.factors.loyaltyDiscount,
    },
  });
}

module.exports = { recordPrice };
