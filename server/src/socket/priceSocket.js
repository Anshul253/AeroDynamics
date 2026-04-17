function setupPriceSocket(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Client joins a product room to receive price updates
    socket.on('join:product', (productId) => {
      socket.join(`product:${productId}`);
      console.log(`[Socket.IO] ${socket.id} joined product:${productId}`);
    });

    // Client leaves a product room
    socket.on('leave:product', (productId) => {
      socket.leave(`product:${productId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });
}

module.exports = { setupPriceSocket };
