require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const { setupPriceSocket } = require('./socket/priceSocket');
const { resetHourlyCounts } = require('./services/demandTracker.service');
const { PORT, CLIENT_URL } = require('./config');

// ─── Create HTTP server + Socket.IO ─────────────────────
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: CLIENT_URL, methods: ['GET', 'POST'] },
});

// Attach io to every request so controllers can broadcast
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Setup Socket.IO event handlers
setupPriceSocket(io);

// ─── Hourly demand counter reset ────────────────────────
setInterval(() => {
  resetHourlyCounts();
}, 60 * 60 * 1000); // every 1 hour

// ─── Start server ───────────────────────────────────────
server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║   Dynamic Pricing System — Server Running    ║
  ║   Port: ${PORT}                                 ║
  ║   Client: ${CLIENT_URL}              ║
  ╚══════════════════════════════════════════════╝
  `);
});
