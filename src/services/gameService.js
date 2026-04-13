/**
 * Service Layer – gameService.js
 *
 * Contains all game business logic. Services read from and write to the model
 * but never interact with sockets directly.  This keeps the business rules
 * independent of the transport layer (Socket.IO).
 *
 * In the Controller–Service–Model pattern:
 *   Controller → calls service methods
 *   Service    → applies business logic, updates the model
 *   Model      → stores / returns data
 */

const gameState = require('../models/gameState');

/**
 * Registers a new player with a default position and zero score.
 * @param {string} id - Socket ID of the joining player
 * @returns {Object} The newly created player object
 */
function joinGame(id) {
  const player = {
    id,
    score: 0,
    position: { x: 0, y: 0 },
  };
  gameState.addPlayer(id, player);
  return player;
}

/**
 * Updates a player's position.
 * @param {string} id - Socket ID of the moving player
 * @param {{ x: number, y: number }} position - New position
 * @returns {Object|null} Updated player object, or null if player not found
 */
function movePlayer(id, position) {
  const player = gameState.getPlayer(id);
  if (!player) return null;

  gameState.updatePlayer(id, { position });
  return gameState.getPlayer(id);
}

/**
 * Removes a player from the game state on disconnect.
 * @param {string} id - Socket ID of the disconnecting player
 */
function removePlayer(id) {
  gameState.removePlayer(id);
}

/**
 * Returns the current state of all players.
 * @returns {Object} players map
 */
function getGameState() {
  return gameState.getPlayers();
}

module.exports = {
  joinGame,
  movePlayer,
  removePlayer,
  getGameState,
};
