const { Router } = require("express");
const { optionalAuth } = require("../middleware/auth");
const { calculateDynamicPrice } = require("../pricing-engine");
const { getProductRecommendations, getUserRecommendations, getTrendingProducts } = require("../services/recommendation.service");

const router = Router();

// Get recommendations for a specific product
router.get("/product/:productId", optionalAuth, async (req, res, next) => {
  try {
    const recs = await getProductRecommendations(req.params.productId, 6);
    const result = recs.map((p) => {
      const pricing = calculateDynamicPrice({ product: p, inventory: p.inventory, demand: p.demandTracker, competitorPrices: p.competitorPrices, user: req.user });
      return { id: p.id, name: p.name, imageUrl: p.imageUrl, category: p.category, basePrice: p.basePrice, currentPrice: pricing.finalPrice, score: p.recommendationScore };
    });
    res.json({ recommendations: result });
  } catch (err) { next(err); }
});

// Get personalized recommendations for logged-in user
router.get("/user", optionalAuth, async (req, res, next) => {
  try {
    const recs = req.user
      ? await getUserRecommendations(req.user.id, 8)
      : await getTrendingProducts(8);
    const result = recs.map((p) => {
      const pricing = calculateDynamicPrice({ product: p, inventory: p.inventory, demand: p.demandTracker, competitorPrices: p.competitorPrices, user: req.user });
      return { id: p.id, name: p.name, imageUrl: p.imageUrl, category: p.category, basePrice: p.basePrice, currentPrice: pricing.finalPrice, reason: p.reason || "Recommended for you", score: p.recommendationScore || p.demandScore };
    });
    res.json({ recommendations: result });
  } catch (err) { next(err); }
});

// Get trending products
router.get("/trending", optionalAuth, async (req, res, next) => {
  try {
    const recs = await getTrendingProducts(8);
    const result = recs.map((p) => {
      const pricing = calculateDynamicPrice({ product: p, inventory: p.inventory, demand: p.demandTracker, competitorPrices: p.competitorPrices, user: req.user });
      return { id: p.id, name: p.name, imageUrl: p.imageUrl, category: p.category, basePrice: p.basePrice, currentPrice: pricing.finalPrice, demandScore: p.demandScore };
    });
    res.json({ trending: result });
  } catch (err) { next(err); }
});

module.exports = router;
