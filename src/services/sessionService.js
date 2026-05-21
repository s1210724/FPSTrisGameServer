const { sessionModel } = require("../models/sessionModel");

function migrateLobbyToSession(lobby, sessions) {
    const sessionId = Math.random().toString(36).slice(2, 10);
    const sessionPassword = Math.random().toString(36).slice(2, 10);
    const session = new sessionModel(sessionId, lobby, sessionPassword);
    sessions[session.id] = session;
    return sessionId;
}

function joinSession(socket, sessionId, sessions) {
    const session = sessions[sessionId];
    if (!session) {
        return null;
    }

    const allJoined = session.addPlayer(socket);
    return allJoined;
}

function setPlayerState(session, playerId, state) {
    if (!session || !playerId) {
        return false;
    }
    return session.setPlayerState(playerId, state);
}

function getPlayerState(session, playerId) {
    if (!session || !playerId) {
        return null;
    }
    return session.getPlayerState(playerId);
}

function getPlayersByState(session, state) {
    if (!session) {
        return [];
    }
    return session.getPlayersByState(state);
}

function getPlayersByStates(session, states) {
    if (!session) {
        return [];
    }
    return session.getPlayersByStates(states);
}

function getAvailableDuelPlayers(session) {
    if (!session) {
        return [];
    }
    // Only 'reviving' and 'alive' players have not yet used a duel.
    const living = session.getPlayersByStates("alive");
    const reviving = session.getPlayersByStates("reviving");
    return [...living, ...reviving];
}

function leaveSession(sessions, sessionId, socketId) {
    const session = sessions[sessionId];
    if (!session) {
        return null;
    }

    session.removePlayer(socketId);
    if (session.getAmountOfPlayers() === 0) {
        delete sessions[sessionId];
        return null;
    }

    return session;
}

function updatePlayerScore(socket, score, session) {
    if (!session) {
        return null;
    }

    session.updatePlayerScore(socket.id, score);

    const highScoreString = session.getHighScoreString();
    return highScoreString;
}

function getAllPlayers(session) {
    return session.getAllPlayers();
}

function getPlayerField(session, playerId) {
    return session.getPlayerField(playerId);
}

function getPlayerFields(session) {
    return session.getPlayerFields();
}

function updatePlayerField(session, playerId, field) {
    return session.updatePlayerField(playerId, field);
}

function clearPlayerField(session, playerId) {
    if (!session || !playerId) {
        return false;
    }
    return session.clearPlayerField(playerId);
}

function getTopPlayersByScore(session, limit = 5) {
    if (!session) {
        return [];
    }
    return session.getTopPlayersByScore(limit);
}

module.exports = {
    migrateLobbyToSession,
    joinSession,
    setPlayerState,
    getPlayerState,
    getPlayersByState,
    getPlayersByStates,
    getAvailableDuelPlayers,
    leaveSession,
    updatePlayerScore,
    getAllPlayers,
    getPlayerField,
    getPlayerFields,
    updatePlayerField,
    clearPlayerField,
    getTopPlayersByScore
};