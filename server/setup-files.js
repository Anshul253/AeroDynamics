const fs = require("fs");
const path = require("path");
const base = path.join(__dirname, "src");

const files = {};

// config/index.js
files["config/index.js"] = `require("dotenv").config();
module.exports = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || "fallback-dev-secret",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "",
};
`;

// config/prisma.js
files["config/prisma.js"] = `const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
module.exports = prisma;
`;

// middleware/auth.js
files["middleware/auth.js"] = `const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");

function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }
  try {
    const token = header.split(" ")[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
}

function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) { req.user = null; return next(); }
  try { req.user = jwt.verify(header.split(" ")[1], JWT_SECRET); } catch { req.user = null; }
  next();
}

module.exports = { authenticate, optionalAuth };
`;

// middleware/admin.js
files["middleware/admin.js"] = `function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required." });
  }
  next();
}
module.exports = { adminOnly };
`;

// middleware/errorHandler.js
files["middleware/errorHandler.js"] = `function errorHandler(err, req, res, next) {
  console.error("Error:", err.message);
  if (err.code === "P2002") return res.status(409).json({ error: "Duplicate record." });
  if (err.code === "P2025") return res.status(404).json({ error: "Record not found." });
  res.status(err.status || 500).json({ error: err.message || "Internal server error." });
}
module.exports = { errorHandler };
`;

// routes/auth.routes.js
files["routes/auth.routes.js"] = `const { Router } = require("express");
const { register, login, getMe } = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth");
const router = Router();
router.post("/register", register);
router.post("/login", login);
router.get("/me", authenticate, getMe);
module.exports = router;
`;

// services/demandTracker.service.js
files["services/demandTracker.service.js"] = `const prisma = require("../config/prisma");

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
`;

// services/priceRecorder.service.js
files["services/priceRecorder.service.js"] = `const prisma = require("../config/prisma");

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
`;

// pricing-engine/factors/demandFactor.js
files["pricing-engine/factors/demandFactor.js"] = `function getDemandFactor(demand) {
  if (!demand) return 1.0;
  const score = (demand.viewCount1h || 0) * 1 + (demand.purchaseCount1h || 0) * 5;
  if (score <= 10) return 0.90;
  if (score <= 30) return 1.00;
  if (score <= 60) return 1.10;
  if (score <= 100) return 1.20;
  return 1.30;
}
module.exports = { getDemandFactor };
`;

// pricing-engine/factors/stockFactor.js
files["pricing-engine/factors/stockFactor.js"] = `function getStockFactor(quantity, lowStockThreshold) {
  if (!lowStockThreshold || lowStockThreshold === 0) return 1.0;
  const ratio = quantity / lowStockThreshold;
  if (ratio > 3.0) return 0.85;
  if (ratio > 1.5) return 0.95;
  if (ratio > 1.0) return 1.00;
  if (ratio > 0.5) return 1.15;
  return 1.30;
}
module.exports = { getStockFactor };
`;

// pricing-engine/factors/timeFactor.js
files["pricing-engine/factors/timeFactor.js"] = `function getTimeFactor() {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  const isWeekend = day === 0 || day === 6;
  let factor = 1.00;
  if ((hour >= 10 && hour <= 13) || (hour >= 19 && hour <= 22)) factor = 1.05;
  else if (hour >= 0 && hour <= 6) factor = 0.92;
  if (isWeekend) factor *= 1.03;
  return Math.round(factor * 100) / 100;
}
module.exports = { getTimeFactor };
`;

// pricing-engine/factors/competitorFactor.js
files["pricing-engine/factors/competitorFactor.js"] = `function getCompetitorFactor(basePrice, competitorPrices) {
  if (!competitorPrices || competitorPrices.length === 0) return 1.0;
  const avg = competitorPrices.reduce((sum, cp) => sum + cp.price, 0) / competitorPrices.length;
  if (basePrice > avg * 1.1) return 0.95;
  if (basePrice < avg * 0.9) return 1.05;
  return 1.0;
}
module.exports = { getCompetitorFactor };
`;

// pricing-engine/factors/loyaltyFactor.js
files["pricing-engine/factors/loyaltyFactor.js"] = `function getLoyaltyDiscount(totalOrders) {
  if (totalOrders >= 20) return 0.90;
  if (totalOrders >= 10) return 0.93;
  if (totalOrders >= 5) return 0.95;
  if (totalOrders >= 1) return 0.98;
  return 1.00;
}
module.exports = { getLoyaltyDiscount };
`;

// pricing-engine/index.js
files["pricing-engine/index.js"] = `const { getDemandFactor } = require("./factors/demandFactor");
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
  finalPrice = Math.max(product.floorPrice, Math.min(product.ceilingPrice, finalPrice));
  finalPrice = Math.round(finalPrice * 100) / 100;

  return {
    finalPrice,
    factors: { demandFactor, stockFactor, timeFactor, competitorFactor, loyaltyDiscount },
    basePrice: product.basePrice,
  };
}

module.exports = { calculateDynamicPrice };
`;

// controllers/auth.controller.js
files["controllers/auth.controller.js"] = `const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const prisma = require("../config/prisma");
const { JWT_SECRET } = require("../config");

async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "Name, email, and password are required." });
    if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters." });
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: "Email already registered." });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { name, email, passwordHash } });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    res.status(201).json({ message: "Registration successful.", token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { next(err); }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required." });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials." });
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials." });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ message: "Login successful.", token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) { next(err); }
}

async function getMe(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, totalOrders: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json({ user });
  } catch (err) { next(err); }
}

module.exports = { register, login, getMe };
`;

// controllers/product.controller.js
files["controllers/product.controller.js"] = `const prisma = require("../config/prisma");
const { calculateDynamicPrice } = require("../pricing-engine");
const { incrementView } = require("../services/demandTracker.service");
const { recordPrice } = require("../services/priceRecorder.service");

async function listProducts(req, res, next) {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { inventory: true, demandTracker: true, competitorPrices: true },
      orderBy: { createdAt: "desc" },
    });
    const result = products.map((product) => {
      const pricing = calculateDynamicPrice({ product, inventory: product.inventory, demand: product.demandTracker, competitorPrices: product.competitorPrices, user: req.user });
      return { id: product.id, name: product.name, description: product.description, imageUrl: product.imageUrl, category: product.category, basePrice: product.basePrice, currentPrice: pricing.finalPrice, pricingFactors: pricing.factors, stock: product.inventory?.quantity ?? 0 };
    });
    res.json({ products: result });
  } catch (err) { next(err); }
}

async function getProduct(req, res, next) {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({ where: { id }, include: { inventory: true, demandTracker: true, competitorPrices: true } });
    if (!product) return res.status(404).json({ error: "Product not found." });
    await incrementView(id);
    const pricing = calculateDynamicPrice({ product, inventory: product.inventory, demand: product.demandTracker, competitorPrices: product.competitorPrices, user: req.user });
    await recordPrice(id, pricing);
    if (req.io) { req.io.to("product:" + id).emit("price:update", { productId: id, price: pricing.finalPrice, factors: pricing.factors }); }
    res.json({ id: product.id, name: product.name, description: product.description, imageUrl: product.imageUrl, category: product.category, basePrice: product.basePrice, floorPrice: product.floorPrice, ceilingPrice: product.ceilingPrice, currentPrice: pricing.finalPrice, pricingFactors: pricing.factors, stock: product.inventory?.quantity ?? 0, demandStats: { viewCount1h: product.demandTracker?.viewCount1h ?? 0, viewCount24h: product.demandTracker?.viewCount24h ?? 0, purchaseCount1h: product.demandTracker?.purchaseCount1h ?? 0, purchaseCount24h: product.demandTracker?.purchaseCount24h ?? 0 } });
  } catch (err) { next(err); }
}

async function getPriceHistory(req, res, next) {
  try {
    const { id } = req.params;
    const days = parseInt(req.query.period) || 7;
    const since = new Date(); since.setDate(since.getDate() - days);
    const history = await prisma.priceHistory.findMany({ where: { productId: id, recordedAt: { gte: since } }, orderBy: { recordedAt: "asc" }, select: { price: true, basePrice: true, demandFactor: true, stockFactor: true, timeFactor: true, recordedAt: true } });
    res.json({ history });
  } catch (err) { next(err); }
}

module.exports = { listProducts, getProduct, getPriceHistory };
`;

Object.entries(files).forEach(([rel, content]) => {
  const full = path.join(base, rel);
  fs.writeFileSync(full, content, "utf8");
  console.log("OK " + rel + " (" + content.length + " bytes)");
});
console.log("\nAll 16 files written successfully!");