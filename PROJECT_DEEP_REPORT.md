# AeroDynamics: Project Deep Report

AeroDynamics is a high-end, B2C drone marketplace that leverages dynamic pricing algorithms to optimize revenue based on real-time market conditions. This report details the technical architecture, core features, and underlying logic of the platform.

---

## 1. Technical Stack

### Frontend (Client)
- **Core**: React 18 with Vite for lightning-fast development.
- **Styling**: Vanilla CSS with a "Stealth Aero" theme, inspired by modern, premium hardware brands like DJI.
- **State Management**: React Hooks (useState, useEffect, useContext) for lightweight and efficient state handling.
- **Real-time UI**: Socket.io-client for live price updates without page refreshes.
- **Icons & Visualization**: Lucide-React for iconography and Recharts for interactive price fluctuation graphs.
- **Routing**: React Router for single-page application navigation.

### Backend (Server)
- **Runtime**: Node.js with Express for a robust RESTful API.
- **Database**: SQLite with Prisma ORM for type-safe database interactions and easy schema migrations.
- **Real-time Server**: Socket.io for managing websocket connections and broadcasting pricing events.
- **Security**: JSON Web Tokens (JWT) for secure authentication and bcryptjs for password hashing.
- **Services**: Custom DemandTracker service for monitoring product popularity and market activity.

---

## 2. Core Architecture & Logic

### A. Dynamic Pricing Engine
The "heart" of AeroDynamics is its multi-factor pricing engine. It calculates a product's `finalPrice` every time an event occurs (view, purchase, time change) or on-demand.

**Key Pricing Factors:**
1. **Demand Factor**: 
   - Uses a score based on views (1x weight) and purchases (5x weight) over the last hour.
   - Low activity (0.90x), High activity (1.20x-1.30x).
2. **Stock Factor**:
   - Compares current quantity against a `lowStockThreshold`.
   - High stock (>3x threshold) gives a 0.85x discount.
   - Low stock (<0.5x threshold) triggers a 1.30x markup.
3. **Time Factor**:
   - Peak hours (10 AM–1 PM, 7 PM–10 PM) trigger a 1.05x increase.
   - Off-peak hours (Midnight–6 AM) offer a 0.92x "Night Owl" discount.
   - Weekends trigger a 1.03x surge.
4. **Competitor Factor**:
   - Compares base price against the average of tracked competitor prices.
   - If our price is >10% higher than average, it drops by 0.95x to stay competitive.
5. **Loyalty Discount**:
   - Reward returning customers based on `totalOrders`.
   - Discounts range from 2% (1 order) to 10% (20+ orders).

**Engine Constraints**: The final price is always clamped between the `floorPrice` (minimum allowed to protect margins) and the `basePrice` (MSRP).

### B. Real-time Synchronization
The platform uses a "Publish-Subscribe" model via Socket.io:
- When a user views a product, the backend increments a view count.
- The pricing engine recalculates the price.
- The new price is "emitted" to all clients currently viewing that specific product page, updating the price chart and display instantly.

---

## 3. Key Features

### Premium User Experience
- **Swipeable Hero Carousel**: An immersive, auto-playing product showcase on the homepage.
- **Interactive Price History**: Visual transparency using `PriceHistory` tracking and Recharts.
- **Logistics Integration**: 
    - Multi-step checkout.
    - **Address Management**: Supports "Home" and "Office" categorization.
    - **Pincode Autofill**: Uses the Indian Postal API for instant city/state mapping.
    - **Future-Dated Delivery**: Forced future-date scheduling for drone asset logistics.

### Administrative Dashboard
- **Catalog Control**: Full CRUD operations for products, including setting floor/ceiling prices.
- **Fulfillment Center**: A dedicated view for admins to track incoming orders with delivery locations and target dates.
- **Inventory Management**: Real-time stock tracking with low-stock visual indicators.
- **User Management**: Viewing and managing the customer base.

---

## 4. Data Model (Schema)

The database (SQLite) is structured via Prisma:
- **User**: Authentication, roles (admin/customer), and order history.
- **Product**: Core metadata, pricing bounds (base, floor), and status.
- **Inventory**: Atomic stock tracking linked to products.
- **DemandTracker**: Real-time windowed metrics for views and purchases.
- **PriceHistory**: Historical snapshots of every price change for transparency.
- **Order/OrderItem**: Detailed records of transaction values and the "Locked price" at the time of purchase.
- **Address**: User delivery locations with geolocation metadata.

---

## 5. Development & Execution

### Prerequisites
- Node.js (v18+)
- npm

### Installation
1. Clone the repository.
2. Run `npm install` in both `client/` and `server/` directories.
3. Initialize the database: `npx prisma db push` inside `server/`.

### Running Locally
- **Backend**: `cd server && npm run dev` (Runs on Port 5000)
- **Frontend**: `cd client && npm run dev` (Runs on Port 5173)

---

*Prepared by Antigravity*
