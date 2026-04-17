const prisma = require("../config/prisma");

async function incrementView(productId) {
  await prisma.demandTracker.update({
    where: { productId },
    data: { viewCount1h: { increment: 1 }, viewCount24h: { increment: 1 } },
  });
}

async function incrementPurchase(productId, qty = 1) {
  await prisma.demandTracker.update({
    where: { productId },
    data: { purchaseCount1h: { increment: qty }, purchaseCount24h: { increment: qty } },
  });
}

async function resetHourlyCounts() {
  await prisma.demandTracker.updateMany({
    data: { viewCount1h: 0, purchaseCount1h: 0, lastResetAt: new Date() },
  });
  console.log("[DemandTracker] Hourly counters reset.");
}

module.exports = { incrementView, incrementPurchase, resetHourlyCounts };
