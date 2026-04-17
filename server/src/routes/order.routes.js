const { Router } = require('express');
const { createOrder, verifyPayment, getUserOrders } = require('../controllers/order.controller');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.use(authenticate);
router.post('/create', createOrder);
router.post('/verify', verifyPayment);
router.get('/', getUserOrders);

module.exports = router;
