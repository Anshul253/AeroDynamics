const { Router } = require('express');
const { getCart, addToCart, updateCartItem, removeFromCart } = require('../controllers/cart.controller');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.use(authenticate); // all cart routes require auth
router.get('/', getCart);
router.post('/', addToCart);
router.put('/:id', updateCartItem);
router.delete('/:id', removeFromCart);

module.exports = router;
