<div align="center">
  <img src="./client/public/favicon.svg" alt="AeroDynamics Logo" width="120" />

  # AeroDynamics 🛸
  
  **Next-Generation Dynamic Pricing Drone Marketplace**

  A full-stack, real-time B2C e-commerce platform that implements algorithmic dynamic pricing based on market demand, stock levels, and competitor analytics.
  
  ![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
  ![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
  ![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
  ![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)
  ![Stripe](https://img.shields.io/badge/stripe-008CDD?style=for-the-badge&logo=stripe&logoColor=white)
</div>

<br />

## ✨ Features

- **Algorithmic Dynamic Pricing**: A custom pricing engine that automatically adjusts product prices based on real-time stock levels, demand (views & history), time decay, and competitor pricing factors.
- **Real-Time Market Sync**: WebSockets (Socket.io) push live price fluctuations down to the clients, complete with visual UI indicators indicating price drops or surges.
- **Modern E-Commerce Flow**: Fully functioning multi-step checkout with address saving, cart workflows, and Razorpay/Stripe integration.
- **Sleek, Premium UI**: State-of-the-art glassmorphism design, utilizing custom CSS variables, micro-animations, Recharts for price history visualization, and dynamic hero product carousels.
- **Admin Command Center**: A protected fulfillment dashboard for store administrators to manage inventory, fulfill orders, and monitor real-time AI pricing analytics.

## 🛠️ Tech Stack

### Frontend (Client)
- **Framework:** React 19 / Vite
- **Styling:** Vanilla CSS (CSS Modules & Global root tokens)
- **State Management:** React Context API
- **Data Visualization:** Recharts
- **Icons:** Lucide React
- **WebSockets:** Socket.io-client

### Backend (Server)
- **Runtime:** Node.js (Express 5.x)
- **Database ORM:** Prisma
- **Database:** SQLite (Easily configurable to PostgreSQL for production)
- **WebSockets:** Socket.io
- **Authentication:** JWT & bcryptjs
- **Payment Gateway:** Stripe / Razorpay

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v18 or higher recommended)
- `npm` or `yarn`

### Installation

1. **Clone the repo**
   ```sh
   git clone https://github.com/Anshul253/AeroDynamics.git
   cd AeroDynamics
   ```

2. **Setup the Backend Server**
   ```sh
   cd server
   npm install
   ```
   
   Create a `.env` file in the `server` directory (Refer to `.env.example`).
   Run Prisma migrations and seed the database with initial drones:
   ```sh
   npm run migrate
   npm run seed
   ```

3. **Setup the Frontend Client**
   ```sh
   cd ../client
   npm install
   ```

4. **Run the Application**
   Open two terminals:
   
   **Terminal 1 (Backend):**
   ```sh
   cd server
   npm run dev
   ```

   **Terminal 2 (Frontend):**
   ```sh
   cd client
   npm run dev
   ```

5. The application will be running at `http://localhost:5173`.

## 📂 Project Architecture

```
AeroDynamics/
├── client/                     # React Frontend
│   ├── public/                 # Static assets & drone imagery
│   ├── src/
│   │   ├── components/         # Reusable UI components (Navbar, Layout, etc.)
│   │   ├── context/            # Globally managed state (AuthContext)
│   │   ├── pages/              # Route views (Home, ProductDetail, Checkout, Admin)
│   │   ├── utils/              # Axios API setup & interceptors
│   │   └── index.css           # Global design system & theme tokens
├── server/                     # Node.js/Express Backend
│   ├── prisma/             
│   │   ├── schema.prisma       # Database models (User, Product, Order, Pricing, etc.)
│   │   └── seed.js             # Initial database loader
│   ├── src/
│   │   ├── controllers/        # Route logic & payload handlers
│   │   ├── middleware/         # Auth & Role validation filters
│   │   ├── pricing-engine/     # The mathematical dynamic pricing logic
│   │   ├── routes/             # Express API routes
│   │   ├── services/           # DB interactions & socket emitters
│   │   ├── socket/             # Socket.io connection handling
│   │   └── server.js           # Express app bootstrap
└── README.md
```

## 🔒 Environment Variables

You will need to establish the following environment variables.

**Server (`.env`)**
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your_secure_jwt_secret"
PORT=5000
CLIENT_URL="http://localhost:5173"
# Stripe Configuration (Optional)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```

**Client (`.env`)** *(Optional)*
```env
VITE_BACKEND_URL="http://localhost:5000"
```

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.
