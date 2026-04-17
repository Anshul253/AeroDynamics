const prisma = require('../config/prisma');

// GET /api/analytics/revenue?period=30
async function getRevenue(req, res, next) {
  try {
    const days = parseInt(req.query.period) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const orders = await prisma.order.findMany({
      where: {
        status: { in: ['paid', 'shipped', 'delivered'] },
        createdAt: { gte: since },
      },
      select: { totalAmount: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const revenueByDate = {};
    orders.forEach((o) => {
      const date = o.createdAt.toISOString().split('T')[0];
      revenueByDate[date] = (revenueByDate[date] || 0) + o.totalAmount;
    });

    const data = Object.entries(revenueByDate).map(([date, revenue]) => ({
      date,
      revenue: Math.round(revenue * 100) / 100,
    }));

    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

    res.json({ data, totalRevenue: Math.round(totalRevenue * 100) / 100, orderCount: orders.length });
  } catch (err) {
    next(err);
  }
}

// GET /api/analytics/top-products
async function getTopProducts(req, res, next) {
  try {
    const trackers = await prisma.demandTracker.findMany({
      orderBy: { viewCount24h: 'desc' },
      take: 10,
      include: {
        product: { select: { name: true, basePrice: true, imageUrl: true } },
      },
    });

    const data = trackers.map((t) => ({
      productId: t.productId,
      name: t.product.name,
      imageUrl: t.product.imageUrl,
      viewCount24h: t.viewCount24h,
      purchaseCount24h: t.purchaseCount24h,
      demandScore: t.viewCount1h + t.purchaseCount1h * 5,
    }));

    res.json({ data });
  } catch (err) {
    next(err);
  }
}

// GET /api/analytics/price-volatility/:productId
async function getPriceVolatility(req, res, next) {
  try {
    const { productId } = req.params;
    const days = parseInt(req.query.period) || 7;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const history = await prisma.priceHistory.findMany({
      where: { productId, recordedAt: { gte: since } },
      orderBy: { recordedAt: 'asc' },
      select: { price: true, basePrice: true, recordedAt: true },
    });

    const prices = history.map((h) => h.price);
    const avg = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
    const min = prices.length > 0 ? Math.min(...prices) : 0;
    const max = prices.length > 0 ? Math.max(...prices) : 0;

    res.json({
      productId,
      dataPoints: history.length,
      stats: {
        avg: Math.round(avg * 100) / 100,
        min: Math.round(min * 100) / 100,
        max: Math.round(max * 100) / 100,
        volatility: Math.round((max - min) * 100) / 100,
      },
      history,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/analytics/overview — dashboard summary
async function getOverview(req, res, next) {
  try {
    const [totalProducts, totalUsers, totalOrders, recentOrders] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.user.count(),
      prisma.order.count(),
      prisma.order.findMany({
        where: { status: { in: ['paid', 'shipped', 'delivered'] } },
        select: { totalAmount: true },
      }),
    ]);

    const totalRevenue = recentOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    res.json({
      totalProducts,
      totalUsers,
      totalOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getRevenue, getTopProducts, getPriceVolatility, getOverview };
