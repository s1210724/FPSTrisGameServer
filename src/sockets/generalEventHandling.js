const { createEmptyField } = require("../public/js/shared/tetrisHelpers");
const { applyLockedBlockToField } = require("../public/js/shared/fieldSync");
const lobbyService = require("../services/lobbyService");
const sessionService = require("../services/sessionService");
const duelService = require("../services/duelService");
const hitscanService = require("../services/hitscanService");
const obstacleService = require("../services/obstacleService");

function getCookieValue(cookieHeader, cookieName) {
    if (!cookieHeader) return null;
    const cookies = cookieHeader.split(";").map((entry) => entry.trim());
    const match = cookies.find((entry) => entry.startsWith(`${cookieName}=`));
    return match ? decodeURIComponent(match.slice(cookieName.length + 1)) : null;
}

function getLobbyBySocketId(socket) {
    const joinedRoomIds = [...socket.rooms].filter((roomId) => roomId !== socket.id);

    if (joinedRoomIds.some((roomId) => global.lobbys[roomId])) {
        const lobbyId = joinedRoomIds.find((roomId) => global.lobbys[roomId]);
        return { type: "lobby", id: lobbyId, data: global.lobbys[lobbyId] };
    }

    if (joinedRoomIds.some((roomId) => global.duels[roomId])) {
        const duelId = joinedRoomIds.find((roomId) => global.duels[roomId]);
        return { type: "duel", id: duelId, data: global.duels[duelId] };
    }

    if (joinedRoomIds.some((roomId) => global.sessions[roomId])) {
        const sessionId = joinedRoomIds.find((roomId) => global.sessions[roomId]);
        return { type: "session", id: sessionId, data: global.sessions[sessionId] };
    }

    return null;
}

function getSessionForSocket(socket) {
    const joinedRoomIds = [...socket.rooms].filter((roomId) => roomId !== socket.id);
    const sessionId = joinedRoomIds.find((roomId) => global.sessions[roomId]);
    return sessionId ? global.sessions[sessionId] : null;
}

function endDuel(io, duelId) {
    hitscanService.endDuel(io, global.duels, duelId);
}

function finalizeSession(io, session) {
    const finalRanking = sessionService.getTopPlayersByScore(session, 5);
    io.to(session.id).emit("finalWinner", { topPlayers: finalRanking });

    const roomSockets = io.sockets.adapter.rooms.get(session.id);
    if (roomSockets) {
        roomSockets.forEach((socketId) => {
            const s = io.sockets.sockets.get(socketId);
            if (s) {
                s.leave(session.id);
                s.disconnect(true);
            }
        });
    }
    delete global.sessions[session.id];
}

function registerEvents(socket, io) {
    socket.on("disconnecting", () => {
        const room = getLobbyBySocketId(socket);
        if (!room) return;

        if (room.type === "lobby") {
            const playerId = socket.user?.username || socket.id;
            lobbyService.leaveLobby(global.lobbys, room.id, playerId);
            io.to(room.id).emit("playerLeft", playerId);
        }
        else if (room.type === "session") {
            sessionService.leaveSession(global.sessions, room.id, socket.id);
            if (room.data.fields) delete room.data.fields[socket.id];
            io.to(room.id).emit("playerLeft", socket.id);
        }
        else if (room.type === "duel") {
            const duel = room.data;
            Object.keys(duel.players).forEach((playerKey) => {
                if (duel.players[playerKey]?.socketId === socket.id) {
                    delete duel.players[playerKey];
                }
            });
            if (Object.keys(duel.players).length === 0) {
                delete global.duels[room.id];
            } else {
                io.to(room.id).emit("playerLeft", socket.id);
            }
        }
    });
}

module.exports = {
    getCookieValue,
    getLobbyBySocketId,
    getSessionForSocket,
    endDuel,
    finalizeSession,
    registerEvents
};