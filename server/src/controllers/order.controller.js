const prisma = require("../config/prisma");
const { calculateDynamicPrice } = require("../pricing-engine");
const { incrementPurchase } = require("../services/demandTracker.service");
const { STRIPE_SECRET_KEY } = require("../config");

let stripe = null;
if (STRIPE_SECRET_KEY) {
  stripe = require("stripe")(STRIPE_SECRET_KEY);
}

// POST /api/orders/create
async function createOrder(req, res, next) {
  try {
    const userId = req.user.id;
    const { deliveryAddressId, deliveryDate } = req.body;
    
    if (!deliveryAddressId) {
      return res.status(400).json({ error: "Delivery address is required." });
    }
    if (!deliveryDate) {
      return res.status(400).json({ error: "Delivery date is required." });
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: { include: { inventory: true, demandTracker: true, competitorPrices: true } } },
    });
    if (cartItems.length === 0) return res.status(400).json({ error: "Cart is empty." });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of cartItems) {
      if (!item.product.inventory || item.product.inventory.quantity < item.quantity) {
        return res.status(400).json({ error: "Insufficient stock for " + item.product.name });
      }
      const pricing = calculateDynamicPrice({ product: item.product, inventory: item.product.inventory, demand: item.product.demandTracker, competitorPrices: item.product.competitorPrices, user });
      totalAmount += pricing.finalPrice * item.quantity;
      orderItemsData.push({ productId: item.productId, quantity: item.quantity, priceAtPurchase: pricing.finalPrice });
    }
    totalAmount = Math.round(totalAmount * 100) / 100;

    // Create Stripe checkout session if configured
    let stripeSessionId = null;
    let stripeUrl = null;
    if (stripe) {
      try {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "payment",
          line_items: cartItems.map((item, i) => ({
            price_data: {
              currency: "inr",
              product_data: { 
                name: item.product.name, 
                images: item.product.imageUrl.startsWith('http') ? [item.product.imageUrl] : [] 
              },
              unit_amount: Math.round(orderItemsData[i].priceAtPurchase * 100),
            },
            quantity: item.quantity,
          })),
          success_url: (process.env.CLIENT_URL || "http://localhost:5173") + "/order-success?session_id={CHECKOUT_SESSION_ID}",
          cancel_url: (process.env.CLIENT_URL || "http://localhost:5173") + "/cart",
        });
        stripeSessionId = session.id;
        stripeUrl = session.url;
      } catch (e) {
        console.log("[Stripe] Session error:", e.message);
        return res.status(500).json({ error: `Stripe Error: ${e.message}` });
      }
    } else {
      return res.status(500).json({ error: "Stripe is not configured. Please add STRIPE_SECRET_KEY to your .env file to enable checkout." });
    }

    const order = await prisma.order.create({
      data: { 
        userId, 
        totalAmount, 
        status: stripe ? "pending" : "paid", 
        razorpayOrderId: stripeSessionId, 
        deliveryAddressId,
        deliveryDate: new Date(deliveryDate),
        items: { create: orderItemsData } 
      },
      include: { items: true },
    });

    for (const item of orderItemsData) {
      await prisma.inventory.update({ where: { productId: item.productId }, data: { quantity: { decrement: item.quantity } } });
      await incrementPurchase(item.productId, item.quantity);
    }
    await prisma.user.update({ where: { id: userId }, data: { totalOrders: { increment: 1 } } });
    await prisma.cartItem.deleteMany({ where: { userId } });

    if (req.io) {
      for (const item of orderItemsData) {
        req.io.to("product:" + item.productId).emit("price:recalculate", { productId: item.productId });
      }
    }

    res.status(201).json({ message: "Order placed.", order: { id: order.id, totalAmount, status: order.status, items: order.items }, stripeUrl, stripeSessionId });
  } catch (err) { next(err); }
}

// POST /api/orders/verify
async function verifyPayment(req, res, next) {
  try {
    const { sessionId } = req.body;
    if (stripe && sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status === "paid") {
        const order = await prisma.order.updateMany({ where: { razorpayOrderId: sessionId }, data: { status: "paid", razorpayPaymentId: session.payment_intent } });
        return res.json({ message: "Payment verified.", status: "paid" });
      }
      return res.status(400).json({ error: "Payment not completed." });
    }
    // Mock verification when Stripe not configured
    const { orderId } = req.body;
    if (orderId) {
      await prisma.order.update({ where: { id: orderId }, data: { status: "paid" } });
    }
    res.json({ message: "Payment verified (mock).", status: "paid" });
  } catch (err) { next(err); }
}

// GET /api/orders
async function getUserOrders(req, res, next) {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: { include: { product: { select: { name: true, imageUrl: true } } } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ orders });
  } catch (err) { next(err); }
}

module.exports = { createOrder, verifyPayment, getUserOrders };
