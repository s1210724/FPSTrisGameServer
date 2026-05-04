const { sessionModel } = require("../models/sessionModel");

function migrateLobbyToSession(lobby, sessions) {
    const sessionId = Math.random().toString(36).slice(2, 10);
    const sessionPassword = Math.random().toString(36).slice(2, 10);
    const session = new sessionModel(sessionId, lobby, sessionPassword);
    sessions[session.id] = session;
    return sessionId;
}

function joinSession(socket, sessionId, sessions) {
    session = sessions[sessionId];
    if (!session) {
        return null;
    }

    const allJoined = session.addPlayer(socket);
    return allJoined;
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
    if (!session || session.type !== "session") {
        return null;
    }

    session.data.updatePlayerScore(socket.id, score);

    const highScoreString = session.data.getHighScoreString();
    return highScoreString;
}

function getAllPlayers(session) {
    return session.getAllPlayers();
}

module.exports = {
    migrateLobbyToSession,
    joinSession,
    leaveSession,
    updatePlayerScore,
    getAllPlayers
};