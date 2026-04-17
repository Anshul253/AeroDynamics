const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');
const {
  listAllProducts, createProduct, updateProduct,
  overridePrice, updateInventory, getDemandStats,
  deleteProduct, listUsers, createUser, deleteUser, listAllOrders
} = require('../controllers/admin.controller');

const router = Router();

router.use(authenticate, adminOnly);

router.get('/products', listAllProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.post('/products/:id/override-price', overridePrice);
router.put('/inventory/:productId', updateInventory);
router.get('/demand/:productId', getDemandStats);

router.get('/users', listUsers);
router.post('/users', createUser);
router.delete('/users/:id', deleteUser);

router.get('/orders', listAllOrders);

module.exports = router;
