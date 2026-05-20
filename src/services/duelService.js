const { duelModel } = require("../models/duelModel");

function createDuel() {
    const duelId = Math.random().toString(36).slice(2, 10);
    const duelPassword = Math.random().toString(36).slice(2, 10);
    const duel = new duelModel(duelId, duelPassword);
    return duel;
}

function joinDuel(duels, socket, duelId, password) {
    const duel = duels[duelId];
    if (!duel || duel.password !== password) {
        return null;
    }

    const added = duel.addPlayer(socket);
    if (!added) {
        return null;
    }

    return duel;
}

function updatePlayerLocation(duels, socket, duelId, location) {
    const duel = duels[duelId];
    if (!duel) {
        return false;
    }
    return duel.updatePlayerLocation(socket.id, location);
}

module.exports = {
    createDuel,
    joinDuel,
    updatePlayerLocation
};