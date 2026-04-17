const prisma = require('../config/prisma');
const { authenticate } = require('../middleware/auth');

// GET /api/cart — list user's cart items
async function getCart(req, res, next) {
  try {
    const items = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: {
        product: {
          include: { inventory: true, demandTracker: true, competitorPrices: true },
        },
      },
      orderBy: { addedAt: 'desc' },
    });

    const { calculateDynamicPrice } = require('../pricing-engine');
    const cart = items.map((item) => {
      const pricing = calculateDynamicPrice({
        product: item.product,
        inventory: item.product.inventory,
        demand: item.product.demandTracker,
        competitorPrices: item.product.competitorPrices,
        user: req.user,
      });
      return {
        id: item.id,
        productId: item.productId,
        name: item.product.name,
        imageUrl: item.product.imageUrl,
        quantity: item.quantity,
        currentPrice: pricing.finalPrice,
        basePrice: item.product.basePrice,
        subtotal: pricing.finalPrice * item.quantity,
      };
    });

    const total = cart.reduce((sum, c) => sum + c.subtotal, 0);

    res.json({ cart, total: Math.round(total * 100) / 100 });
  } catch (err) {
    next(err);
  }
}

// POST /api/cart — add item to cart
async function addToCart(req, res, next) {
  try {
    const { productId, quantity = 1 } = req.body;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    const item = await prisma.cartItem.upsert({
      where: { userId_productId: { userId: req.user.id, productId } },
      update: { quantity: { increment: quantity } },
      create: { userId: req.user.id, productId, quantity },
    });

    res.status(201).json({ message: 'Added to cart.', item });
  } catch (err) {
    next(err);
  }
}

// PUT /api/cart/:id — update qty
async function updateCartItem(req, res, next) {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id } });
      return res.json({ message: 'Item removed from cart.' });
    }

    const item = await prisma.cartItem.update({
      where: { id },
      data: { quantity },
    });

    res.json({ item });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/cart/:id
async function removeFromCart(req, res, next) {
  try {
    await prisma.cartItem.delete({ where: { id: req.params.id } });
    res.json({ message: 'Item removed.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getCart, addToCart, updateCartItem, removeFromCart };
