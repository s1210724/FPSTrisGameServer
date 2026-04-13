/**
 * Model Layer – gameState.js
 *
 * Stores the shared game state. This is the single source of truth for all
 * connected players. The model has no knowledge of sockets or business rules;
 * it simply provides get/set operations on the data.
 *
 * In the Controller–Service–Model pattern:
 *   Model  → holds data (players map)
 *   Service→ reads/writes the model according to business rules
 *   Controller (socket handler) → delegates to the service
 */

// players is a plain object acting as a map: socketId → player object
const players = {};

/**
 * Returns the full players map.
 * @returns {Object}
 */
function getPlayers() {
  return players;
}

/**
 * Adds a new player to the state.
 * @param {string} id - Socket ID
 * @param {Object} playerData - Initial player data
 */
function addPlayer(id, playerData) {
  players[id] = playerData;
}

/**
 * Updates an existing player's data (shallow merge).
 * @param {string} id - Socket ID
 * @param {Object} updates - Fields to update
 */
function updatePlayer(id, updates) {
  if (players[id]) {
    Object.assign(players[id], updates);
  }
}

/**
 * Removes a player from the state.
 * @param {string} id - Socket ID
 */
function removePlayer(id) {
  delete players[id];
}

/**
 * Returns a single player by socket ID.
 * @param {string} id - Socket ID
 * @returns {Object|undefined}
 */
function getPlayer(id) {
  return players[id];
}

module.exports = {
  getPlayers,
  addPlayer,
  updatePlayer,
  removePlayer,
  getPlayer,
};
