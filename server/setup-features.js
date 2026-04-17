const fs = require("fs");
const path = require("path");
const base = path.join(__dirname, "src");

const files = {};

//  services/recommendation.service.js (AI Recommendations) 
files["services/recommendation.service.js"] = `const prisma = require("../config/prisma");

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
`;

//  routes/recommendation.routes.js 
files["routes/recommendation.routes.js"] = `const { Router } = require("express");
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
`;

//  Updated order.controller.js with Stripe 
files["controllers/order.controller.js"] = `const prisma = require("../config/prisma");
const { calculateDynamicPrice } = require("../pricing-engine");
const { incrementPurchase } = require("../services/demandTracker.service");
const { STRIPE_SECRET_KEY } = require("../config");

let stripe = null;
try {
  if (STRIPE_SECRET_KEY && !STRIPE_SECRET_KEY.includes("xxxx") && STRIPE_SECRET_KEY.length > 10) {
    stripe = require("stripe")(STRIPE_SECRET_KEY);
  }
} catch (e) { console.log("[Stripe] Not configured:", e.message); }

// POST /api/orders/create
async function createOrder(req, res, next) {
  try {
    const userId = req.user.id;
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: { include: { inventory: true, demandTracker: true, competitorPrices: true } } },
    });
    if (cartItems.length === 0) return res.status(400).json({ error: "Cart is empty." });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of cartItems) {
      if (!item.product.inventory || item.product.inventory.quantity < item.quantity) {
        return res.status(400).json({ error: "Insufficient stock for " + item.product.name });
      }
      const pricing = calculateDynamicPrice({ product: item.product, inventory: item.product.inventory, demand: item.product.demandTracker, competitorPrices: item.product.competitorPrices, user });
      totalAmount += pricing.finalPrice * item.quantity;
      orderItemsData.push({ productId: item.productId, quantity: item.quantity, priceAtPurchase: pricing.finalPrice });
    }
    totalAmount = Math.round(totalAmount * 100) / 100;

    // Create Stripe checkout session if configured
    let stripeSessionId = null;
    let stripeUrl = null;
    if (stripe) {
      try {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "payment",
          line_items: cartItems.map((item, i) => ({
            price_data: {
              currency: "inr",
              product_data: { name: item.product.name, images: [item.product.imageUrl] },
              unit_amount: Math.round(orderItemsData[i].priceAtPurchase * 100),
            },
            quantity: item.quantity,
          })),
          success_url: (process.env.CLIENT_URL || "http://localhost:5173") + "/order-success?session_id={CHECKOUT_SESSION_ID}",
          cancel_url: (process.env.CLIENT_URL || "http://localhost:5173") + "/cart",
        });
        stripeSessionId = session.id;
        stripeUrl = session.url;
      } catch (e) { console.log("[Stripe] Session error:", e.message); }
    }

    const order = await prisma.order.create({
      data: { userId, totalAmount, status: stripe ? "pending" : "paid", razorpayOrderId: stripeSessionId, items: { create: orderItemsData } },
      include: { items: true },
    });

    for (const item of orderItemsData) {
      await prisma.inventory.update({ where: { productId: item.productId }, data: { quantity: { decrement: item.quantity } } });
      await incrementPurchase(item.productId, item.quantity);
    }
    await prisma.user.update({ where: { id: userId }, data: { totalOrders: { increment: 1 } } });
    await prisma.cartItem.deleteMany({ where: { userId } });

    if (req.io) {
      for (const item of orderItemsData) {
        req.io.to("product:" + item.productId).emit("price:recalculate", { productId: item.productId });
      }
    }

    res.status(201).json({ message: "Order placed.", order: { id: order.id, totalAmount, status: order.status, items: order.items }, stripeUrl, stripeSessionId });
  } catch (err) { next(err); }
}

// POST /api/orders/verify
async function verifyPayment(req, res, next) {
  try {
    const { sessionId } = req.body;
    if (stripe && sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === "paid") {
        const order = await prisma.order.updateMany({ where: { razorpayOrderId: sessionId }, data: { status: "paid", razorpayPaymentId: session.payment_intent } });
        return res.json({ message: "Payment verified.", status: "paid" });
      }
      return res.status(400).json({ error: "Payment not completed." });
    }
    // Mock verification when Stripe not configured
    const { orderId } = req.body;
    if (orderId) {
      await prisma.order.update({ where: { id: orderId }, data: { status: "paid" } });
    }
    res.json({ message: "Payment verified (mock).", status: "paid" });
  } catch (err) { next(err); }
}

// GET /api/orders
async function getUserOrders(req, res, next) {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: { include: { product: { select: { name: true, imageUrl: true } } } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ orders });
  } catch (err) { next(err); }
}

module.exports = { createOrder, verifyPayment, getUserOrders };
`;

//  Updated app.js with recommendation routes 
files["app.js"] = `const express = require("express");
const cors = require("cors");
const { CLIENT_URL } = require("./config");
const { errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth.routes");
const productRoutes = require("./routes/product.routes");
const cartRoutes = require("./routes/cart.routes");
const orderRoutes = require("./routes/order.routes");
const adminRoutes = require("./routes/admin.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const recommendationRoutes = require("./routes/recommendation.routes");

const app = express();

app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/recommendations", recommendationRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Route " + req.method + " " + req.path + " not found." });
});
app.use(errorHandler);

module.exports = app;
`;

Object.entries(files).forEach(([rel, content]) => {
  const full = path.join(base, rel);
  const dir = path.dirname(full);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(full, content, "utf8");
  console.log("OK " + rel + " (" + content.length + " bytes)");
});
console.log("\nFeature files written!");