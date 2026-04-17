const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const PRODUCTS = [
  {
    name: 'DJI Mavic 3 Pro',
    description: 'Flagship camera drone with triple-lens system and omnidirectional obstacle sensing.',
    imageUrl: '/drones/mavic.png',
    category: 'Ready-to-Fly',
    basePrice: 180000,
    floorPrice: 160000,
    ceilingPrice: 220000,
    stock: 12,
  },
  {
    name: 'FPV Racing Drone Frame (Carbon Fiber) 5-inch',
    description: 'Ultra-lightweight and crash-resistant 5-inch carbon fiber freestyle frame.',
    imageUrl: '/drones/frame.png',
    category: 'Frames',
    basePrice: 4500,
    floorPrice: 3500,
    ceilingPrice: 6000,
    stock: 45,
  },
  {
    name: 'XING-E Pro 2207 1800KV Brushless Motor',
    description: 'High-performance brushless motor designed for 6S 5-inch FPV drones.',
    imageUrl: '/drones/motor.png',
    category: 'Motors',
    basePrice: 1200,
    floorPrice: 900,
    ceilingPrice: 1800,
    stock: 120,
  },
  {
    name: 'T-Motor F55A PRO II 4-in-1 ESC',
    description: 'Reliable 55A electronic speed controller capable of handling extreme racing outputs.',
    imageUrl: '/drones/esc.png',
    category: 'Electronics',
    basePrice: 5500,
    floorPrice: 4800,
    ceilingPrice: 7000,
    stock: 30,
  },
  {
    name: 'DJI O3 Air Unit (Digital FPV System)',
    description: 'Advanced digital video transmission system providing low-latency 1080p/100fps video.',
    imageUrl: '/drones/o3.png',
    category: 'Video',
    basePrice: 18500,
    floorPrice: 16000,
    ceilingPrice: 22000,
    stock: 25,
  },
  {
    name: 'SpeedyBee F405 V3 Flight Controller',
    description: 'Feature-packed flight controller with built-in Bluetooth for easy betaflight configuration.',
    imageUrl: '/drones/fc.png',
    category: 'Electronics',
    basePrice: 3500,
    floorPrice: 2800,
    ceilingPrice: 4500,
    stock: 40,
  },
  {
    name: 'CNHL Black Series 1300mAh 6S 100C LiPo Battery',
    description: 'High discharge rate 6S battery for maximum punch-outs and aggressive freestyle.',
    imageUrl: '/drones/lipo.png',
    category: 'Batteries',
    basePrice: 2200,
    floorPrice: 1800,
    ceilingPrice: 3000,
    stock: 80,
  },
  {
    name: 'Radiomaster TX16S Mark II Radio Transmitter',
    description: 'OpenTX/EdgeTX compatible radio with Hall sensor gimbals and multi-protocol support.',
    imageUrl: '/drones/radio.png',
    category: 'Transmitters',
    basePrice: 16500,
    floorPrice: 14000,
    ceilingPrice: 19000,
    stock: 18,
  },
  {
    name: 'Gemfan Hurricane 51466 V2 Propellers (Set of 4)',
    description: 'Durable and highly responsive polycarbonate props optimized for high KV motors.',
    imageUrl: '/drones/props.png',
    category: 'Propellers',
    basePrice: 300,
    floorPrice: 200,
    ceilingPrice: 500,
    stock: 500,
  },
  {
    name: 'Foxeer T-Rex Micro FPV Camera',
    description: '1500TVL analog FPV camera providing exceptional low-light performance and WDR.',
    imageUrl: '/drones/camera.png',
    category: 'Video',
    basePrice: 2800,
    floorPrice: 2200,
    ceilingPrice: 3500,
    stock: 35,
  }
];

const COMPETITORS = ['DroneHobbyStore', 'AeroPartsIndia', 'FPVCentral'];

async function main() {
  console.log('🌱 Initiating Drone Platform Wipe & Seed Protocol...\n');

  // WIPE DATABASE CLEAN
  console.log('Wiping existing data for catalog pivot...');
  // Deleting users cascades to everything except maybe products. 
  // We'll delete sequentially to handle referential integrity safely without breaking.
  await prisma.priceHistory.deleteMany();
  await prisma.competitorPrice.deleteMany();
  await prisma.demandTracker.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
  console.log('Clean slate achieved.\n');

  // Create admin user
  const adminHash = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@dynamicpricing.com',
      passwordHash: adminHash,
      role: 'admin',
    },
  });
  console.log(`✅ Admin user generated: ${admin.email}`);

  // Create test customer
  const customerHash = await bcrypt.hash('customer123', 12);
  const customer = await prisma.user.create({
    data: {
      name: 'Test Customer',
      email: 'customer@test.com',
      passwordHash: customerHash,
      role: 'customer',
      totalOrders: 0,
    },
  });
  console.log(`✅ Customer user generated: ${customer.email}`);

  // Seed drone products
  for (const p of PRODUCTS) {
    const product = await prisma.product.create({
      data: {
        name: p.name,
        description: p.description,
        imageUrl: p.imageUrl,
        category: p.category,
        basePrice: p.basePrice,
        floorPrice: p.floorPrice,
        ceilingPrice: p.ceilingPrice,
        inventory: {
          create: {
            quantity: p.stock,
            lowStockThreshold: Math.max(5, Math.floor(p.stock * 0.15)),
          },
        },
        demandTracker: {
          create: {
            viewCount1h: Math.floor(Math.random() * 20),
            viewCount24h: Math.floor(Math.random() * 150),
            purchaseCount1h: Math.floor(Math.random() * 2),
            purchaseCount24h: Math.floor(Math.random() * 10),
          },
        },
      },
    });

    // Add pseudo-competitor prices
    for (const comp of COMPETITORS) {
      const variance = 0.85 + Math.random() * 0.30; 
      await prisma.competitorPrice.create({
        data: {
          productId: product.id,
          competitorName: comp,
          price: Math.round(p.basePrice * variance * 100) / 100,
        },
      });
    }
    console.log(`  📦 ${product.name} — ₹${p.basePrice}`);
  }

  console.log('\n✅ Database pivoting complete! AeroDynamics catalog loaded.\n');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
