const prisma = require("../config/prisma");

/**
 * AI Product Recommendation Engine
 * Uses category similarity + purchase history + view correlation
 */

// Get recommendations based on a product (same category, similar price range)
async function getProductRecommendations(productId, limit = 6) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return [];

  // Find products in the same category or similar price range (+-30%)
  const recommendations = await prisma.product.findMany({
    where: {
      id: { not: productId },
      isActive: true,
      OR: [
        { category: product.category },
        { basePrice: { gte: product.basePrice * 0.7, lte: product.basePrice * 1.3 } },
      ],
    },
    include: { inventory: true, demandTracker: true, competitorPrices: true },
    take: limit * 2,
  });

  // Score and rank recommendations
  const scored = recommendations.map((rec) => {
    let score = 0;
    if (rec.category === product.category) score += 50;
    const priceDiff = Math.abs(rec.basePrice - product.basePrice) / product.basePrice;
    score += Math.max(0, 30 - priceDiff * 100);
    if (rec.demandTracker) score += Math.min(20, rec.demandTracker.purchaseCount24h);
    return { ...rec, recommendationScore: Math.round(score) };
  });

  scored.sort((a, b) => b.recommendationScore - a.recommendationScore);
  return scored.slice(0, limit);
}

// Get personalized recommendations based on user purchase history
async function getUserRecommendations(userId, limit = 8) {
  // Get user's purchased categories and price ranges
  const orders = await prisma.order.findMany({
    where: { userId, status: { in: ["paid", "shipped", "delivered"] } },
    include: { items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  if (orders.length === 0) {
    // New user — return trending products (highest demand)
    return getTrendingProducts(limit);
  }

  // Extract categories and price ranges from purchase history
  const purchasedProductIds = new Set();
  const categoryCount = {};
  let totalPrice = 0;
  let itemCount = 0;

  orders.forEach((order) => {
    order.items.forEach((item) => {
      purchasedProductIds.add(item.productId);
      categoryCount[item.product.category] = (categoryCount[item.product.category] || 0) + 1;
      totalPrice += item.product.basePrice;
      itemCount++;
    });
  });

  const avgPrice = totalPrice / itemCount;
  const topCategories = Object.entries(categoryCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat);

  // Find products in preferred categories/price range that user hasn't bought
  const recommendations = await prisma.product.findMany({
    where: {
      id: { notIn: [...purchasedProductIds] },
      isActive: true,
      OR: [
        { category: { in: topCategories } },
        { basePrice: { gte: avgPrice * 0.5, lte: avgPrice * 1.5 } },
      ],
    },
    include: { inventory: true, demandTracker: true, competitorPrices: true },
    take: limit * 2,
  });

  // Score recommendations
  const scored = recommendations.map((rec) => {
    let score = 0;
    if (topCategories.includes(rec.category)) {
      const catRank = topCategories.indexOf(rec.category);
      score += 40 - catRank * 10;
    }
    const priceDiff = Math.abs(rec.basePrice - avgPrice) / avgPrice;
    score += Math.max(0, 30 - priceDiff * 50);
    if (rec.demandTracker) score += Math.min(20, rec.demandTracker.purchaseCount24h * 2);
    if (rec.inventory && rec.inventory.quantity < rec.inventory.lowStockThreshold) score += 10;
    return { ...rec, recommendationScore: Math.round(score), reason: topCategories.includes(rec.category) ? "Based on your purchase history" : "You might also like" };
  });

  scored.sort((a, b) => b.recommendationScore - a.recommendationScore);
  return scored.slice(0, limit);
}

// Get trending products (highest demand score)
async function getTrendingProducts(limit = 8) {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: { inventory: true, demandTracker: true, competitorPrices: true },
  });

  const scored = products.map((p) => {
    const demandScore = p.demandTracker
      ? p.demandTracker.viewCount24h + p.demandTracker.purchaseCount24h * 5
      : 0;
    return { ...p, demandScore, reason: "Trending now" };
  });

  scored.sort((a, b) => b.demandScore - a.demandScore);
  return scored.slice(0, limit);
}

module.exports = { getProductRecommendations, getUserRecommendations, getTrendingProducts };
