const prisma = require("../config/prisma");
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
