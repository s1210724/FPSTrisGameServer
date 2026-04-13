/**
 * Entry Point – server.js
 *
 * Sets up the Express app, wraps it in a Node.js HTTP server, attaches
 * Socket.IO to that HTTP server, and starts listening.
 *
 * Wiring summary:
 *   Express  → handles any REST routes (currently just a health-check)
 *   HTTP     → shared between Express and Socket.IO
 *   Socket.IO → delegates each connection to the controller (gameSocket.js)
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { registerGameHandlers } = require('./sockets/gameSocket');

const PORT = process.env.PORT || 3000;

// --- Express setup ---
const app = express();
app.use(express.json());

// Simple health-check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'FPSTris Game Server running' });
});

// --- HTTP server (shared with Socket.IO) ---
const httpServer = http.createServer(app);

// --- Socket.IO setup ---
const io = new Server(httpServer, {
  cors: {
    // Restrict allowed origins via the CORS_ORIGIN environment variable.
    // Default to localhost:3000 so the server works out-of-the-box in
    // development without exposing an open wildcard in production.
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
});

/**
 * For every new socket connection, register the game event handlers.
 * The connection handler itself is the only logic that lives at this level;
 * everything else is delegated to the controller layer.
 */
io.on('connection', (socket) => {
  registerGameHandlers(io, socket);
});

// --- Start the server ---
httpServer.listen(PORT, () => {
  console.log(`[Server] FPSTris Game Server listening on port ${PORT}`);
});

module.exports = { app, httpServer, io }; // exported for testing
