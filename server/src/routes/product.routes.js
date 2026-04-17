const { Router } = require('express');
const { listProducts, getProduct, getPriceHistory } = require('../controllers/product.controller');
const { optionalAuth } = require('../middleware/auth');

const router = Router();

router.get('/', optionalAuth, listProducts);
router.get('/:id', optionalAuth, getProduct);
router.get('/:id/history', getPriceHistory);

module.exports = router;
