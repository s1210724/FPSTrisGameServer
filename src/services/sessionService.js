const { sessionModel } = require("../models/sessionModel");

function migrateLobbyToSession(lobby, sessions) {
    const sessionId = Math.random().toString(36).slice(2, 10);
    const sessionPassword = Math.random().toString(36).slice(2, 10);
    const session = new sessionModel(sessionId, lobby, sessionPassword);
    sessions[session.id] = session;
    return sessionId;
}


module.exports = {
    migrateLobbyToSession
};