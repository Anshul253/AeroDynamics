const { Router } = require('express');
const { createAddress, listAddresses } = require('../controllers/address.controller');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.use(authenticate);

router.get('/', listAddresses);
router.post('/', createAddress);

module.exports = router;
