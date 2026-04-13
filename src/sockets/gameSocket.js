/**
 * Controller Layer – gameSocket.js
 *
 * Acts as the socket controller. Its only responsibilities are:
 *   1. Receiving incoming socket events from clients
 *   2. Delegating to the service layer for all business logic
 *   3. Emitting results back to clients
 *
 * No game logic lives here. If you need to change rules (e.g. how positions
 * are validated), do that in gameService.js, not here.
 *
 * In the Controller–Service–Model pattern:
 *   Controller (this file) → thin layer, handles I/O
 *   Service  → all logic
 *   Model    → data storage
 */

const gameService = require('../services/gameService');

/**
 * Registers all game-related socket event handlers for a single connection.
 * @param {import('socket.io').Server} io   - The Socket.IO server instance
 * @param {import('socket.io').Socket} socket - The connected socket
 */
function registerGameHandlers(io, socket) {
  console.log(`[Socket] Player connected: ${socket.id}`);

  /**
   * "joinGame" event
   * Client sends this when it wants to join the game session.
   * No payload required.
   */
  socket.on('joinGame', () => {
    const player = gameService.joinGame(socket.id);
    console.log(`[Socket] Player joined: ${socket.id}`);

    // Confirm to the joining player
    socket.emit('joinedGame', player);

    // Broadcast updated game state to all connected clients
    io.emit('gameState', gameService.getGameState());
  });

  /**
   * "move" event
   * Client sends a new position for the player.
   * @param {{ x: number, y: number }} position - New position
   */
  socket.on('move', (position) => {
    const updatedPlayer = gameService.movePlayer(socket.id, position);
    if (!updatedPlayer) return; // Ignore moves from players who haven't joined

    console.log(`[Socket] Player moved: ${socket.id}`, position);

    // Broadcast updated game state to all connected clients
    io.emit('gameState', gameService.getGameState());
  });

  /**
   * "disconnect" event
   * Fired automatically by Socket.IO when a client disconnects.
   */
  socket.on('disconnect', () => {
    console.log(`[Socket] Player disconnected: ${socket.id}`);
    gameService.removePlayer(socket.id);

    // Broadcast updated game state so other clients know the player left
    io.emit('gameState', gameService.getGameState());
  });
}

module.exports = { registerGameHandlers };
