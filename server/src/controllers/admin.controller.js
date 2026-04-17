const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');

// GET /api/admin/products — all products (including inactive)
async function listAllProducts(req, res, next) {
  try {
    const products = await prisma.product.findMany({
      include: { inventory: true, demandTracker: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ products });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/products — create product
async function createProduct(req, res, next) {
  try {
    const { name, description, imageUrl, category, basePrice, floorPrice, ceilingPrice, stockQuantity } = req.body;

    const product = await prisma.product.create({
      data: {
        name,
        description: description || '',
        imageUrl: imageUrl || '/placeholder.jpg',
        category: category || 'General',
        basePrice: parseFloat(basePrice),
        floorPrice: parseFloat(floorPrice || basePrice * 0.7),
        ceilingPrice: parseFloat(ceilingPrice || basePrice * 1.5),
        inventory: {
          create: { quantity: parseInt(stockQuantity || 50) },
        },
        demandTracker: {
          create: {},
        },
      },
      include: { inventory: true, demandTracker: true },
    });

    res.status(201).json({ message: 'Product created.', product });
  } catch (err) {
    next(err);
  }
}

// PUT /api/admin/products/:id — update product
async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, imageUrl, category, basePrice, floorPrice, ceilingPrice, isActive } = req.body;

    const data = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (imageUrl !== undefined) data.imageUrl = imageUrl;
    if (category !== undefined) data.category = category;
    if (basePrice !== undefined) data.basePrice = parseFloat(basePrice);
    if (floorPrice !== undefined) data.floorPrice = parseFloat(floorPrice);
    if (ceilingPrice !== undefined) data.ceilingPrice = parseFloat(ceilingPrice);
    if (isActive !== undefined) data.isActive = isActive;

    const product = await prisma.product.update({
      where: { id },
      data,
    });

    res.json({ message: 'Product updated.', product });
  } catch (err) {
    next(err);
  }
}

// POST /api/admin/products/:id/override-price — override pricing bounds
async function overridePrice(req, res, next) {
  try {
    const { id } = req.params;
    const { newBasePrice, newFloorPrice, newCeilingPrice } = req.body;

    const data = {};
    if (newBasePrice) data.basePrice = parseFloat(newBasePrice);
    if (newFloorPrice) data.floorPrice = parseFloat(newFloorPrice);
    if (newCeilingPrice) data.ceilingPrice = parseFloat(newCeilingPrice);

    const product = await prisma.product.update({ where: { id }, data });

    // Broadcast override via Socket.IO
    if (req.io) {
      req.io.to(`product:${id}`).emit('price:override', {
        productId: id,
        message: 'Price updated by admin',
      });
    }

    res.json({ message: 'Price overridden.', product });
  } catch (err) {
    next(err);
  }
}

// PUT /api/admin/inventory/:productId — update stock
async function updateInventory(req, res, next) {
  try {
    const { productId } = req.params;
    const { quantity, lowStockThreshold } = req.body;

    const data = {};
    if (quantity !== undefined) data.quantity = parseInt(quantity);
    if (lowStockThreshold !== undefined) data.lowStockThreshold = parseInt(lowStockThreshold);

    const inventory = await prisma.inventory.update({
      where: { productId },
      data,
    });

    res.json({ message: 'Inventory updated.', inventory });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/demand/:productId — demand stats
async function getDemandStats(req, res, next) {
  try {
    const tracker = await prisma.demandTracker.findUnique({
      where: { productId: req.params.productId },
    });
    if (!tracker) return res.status(404).json({ error: 'No demand data.' });
    res.json({ demand: tracker });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/admin/products/:id
async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;
    const count = await prisma.orderItem.count({ where: { productId: id } });
    if (count > 0) {
      const product = await prisma.product.update({ where: { id }, data: { isActive: false } });
      return res.json({ message: 'Product soft-deleted (deactivated) due to existing financial records.', product });
    }
    await prisma.product.delete({ where: { id } });
    res.json({ message: 'Product deleted permanently.' });
  } catch (err) { next(err); }
}

// GET /api/admin/users
async function listUsers(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, totalOrders: true, createdAt: true }
    });
    res.json({ users });
  } catch (err) { next(err); }
}

// POST /api/admin/users
async function createUser(req, res, next) {
  try {
    const { name, email, password, role } = req.body;
    const passwordHash = await bcrypt.hash(password || 'password123', 12);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: role || 'customer' },
      select: { id: true, name: true, email: true, role: true }
    });
    res.status(201).json({ message: 'User created.', user });
  } catch (err) { next(err); }
}

// DELETE /api/admin/users/:id
async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    const count = await prisma.order.count({ where: { userId: id } });
    if (count > 0) {
      return res.status(400).json({ error: 'Cannot delete a user with active purchase history.' });
    }
    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User deleted.' });
  } catch (err) { next(err); }
}

// GET /api/admin/orders
async function listAllOrders(req, res, next) {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        address: true,
        items: { include: { product: { select: { name: true, imageUrl: true } } } }
      }
    });
    res.json({ orders });
  } catch (err) { next(err); }
}

module.exports = { listAllProducts, createProduct, updateProduct, overridePrice, updateInventory, getDemandStats, deleteProduct, listUsers, createUser, deleteUser, listAllOrders };
