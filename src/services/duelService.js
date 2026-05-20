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
    duel.addplayer(socket);
    return duel;
}

module.exports = {
    createDuel,
    joinDuel
};