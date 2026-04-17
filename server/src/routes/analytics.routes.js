const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');
const { getRevenue, getTopProducts, getPriceVolatility, getOverview } = require('../controllers/analytics.controller');

const router = Router();

router.use(authenticate, adminOnly);
router.get('/revenue', getRevenue);
router.get('/top-products', getTopProducts);
router.get('/price-volatility/:productId', getPriceVolatility);
router.get('/overview', getOverview);

module.exports = router;
