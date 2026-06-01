const { lobbyModel } = require("../models/lobbyModel");

function joinLobby(lobbys, socket) {
    // Find an existing lobby that is not full
    let lobby = Object.values(lobbys).find((l) => !l.locked);

    // If no such lobby exists, create a new one
    if (!lobby) {
        const lobbyId = Math.random().toString(36).slice(2, 10);
        lobby = new lobbyModel(lobbyId);
        lobbys[lobbyId] = lobby;
    }

    const playerAlreadyInLobby = lobby.hasPlayer(socket.user?.username || socket.id);
    if (!playerAlreadyInLobby) {
        lobby.joinPlayer(socket);
        return lobby;
    }

    return;
}

function getAllPlayers(lobby) {
    return lobby.getAllPlayers();
}

function leaveLobby(lobbys, lobbyId, playerId) {
    const lobby = lobbys[lobbyId];
    if (!lobby) {
        return null;
    }

    const removed = lobby.leavePlayer(playerId);
    if (!removed) {
        return null;
    }

    if (lobby.getAllPlayers().length === 0) {
        delete lobbys[lobbyId];
        return null;
    }

    return lobby;
}

module.exports = {
    joinLobby,
    getAllPlayers,
    leaveLobby,
};