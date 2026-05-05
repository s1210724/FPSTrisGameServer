const { get } = require("../app");
const lobbyService = require("../services/lobbyService");
const sessionService = require("../services/sessionService");
const { createEmptyField } = require("../public/js/shared/tetrisHelpers");
const { applyLockedBlockToField } = require("../public/js/shared/fieldSync");
const lobbys = {};
const sessions = {};
const duels = {};
const snapshotIntervalMs = 5000;

module.exports = (io) => {
    setInterval(() => {
        Object.values(sessions).forEach((session) => {
            if (!session || !session.fields) {
                return;
            }

            io.to(session.id).emit("sessionState", session.fields); 
        });
    }, snapshotIntervalMs);

    io.on("connection", (socket) => {
        socket.on("joinLobby", (data, ack) => {
            // add player to a lobby or create one if all are full on none exist
            const lobby = lobbyService.joinLobby(lobbys, socket);

            // notify existing players in the lobby about the new player and then subscribe the new player to the lobby room for future updates
            io.to(lobby.id).emit("newConnection", socket.id);
            socket.join(lobby.id);

            // acknowledge the join with the current player list in the lobby
            if (typeof ack === "function") {
                ack(lobbyService.getAllPlayers(lobby));
            }
        });

        socket.on("joinSession", (data, ack) => {
            const { sessionId, password } = data;
            const allJoined = sessionService.joinSession(socket, sessionId, sessions);
            const session = sessions[sessionId];

            if (!session) {
                if (typeof ack === "function") {
                    ack({ error: "Session not found" });
                }
                return;
            }

            if (session.password !== password) {
                if (typeof ack === "function") {
                    ack({ error: "Incorrect password" });
                }
                return;
            }

            socket.join(sessionId);

            session.fields = session.fields || {};
            sessionService.getAllPlayers(session).forEach((playerId) => {
                if (!session.fields[playerId]) {
                    session.fields[playerId] = createEmptyField();
                }
            });

            if (typeof ack === "function") {
                ack(socket.id);
            }

            socket.emit("sessionState", session.fields);
            
            if (allJoined) {
                io.to(sessionId).emit("sessionReady", (sessionService.getAllPlayers(session))); // send all players to all players
                io.to(sessionId).emit("sessionState", session.fields);
            }
        });

        socket.on("migrateToSession", () => {
            const room = getLobbyBySocketId(socket);
            if (!room || room.type !== "lobby") {
                return;
            }

            const sessionId = sessionService.migrateLobbyToSession(room.data, sessions);
            // socket.emit("sessionMigrated", {id: sessionId, password: sessions[sessionId].password});
            io.to(room.data.id).emit("sessionMigrated", {id: sessionId, password: sessions[sessionId].password, playerAmount: room.data.getAllPlayers().length});
        });

        socket.on('updateScore', (score) => {
            lobby = getLobbyBySocketId(socket);
            const HighScoreString = sessionService.updatePlayerScore(socket, score, lobby);
            
            // socket.emit("updateScore", HighScoreString);
            io.to(lobby.data.id).emit("updateScore", HighScoreString);
        });

        socket.on("blockLocked", (data) => {
            const room = getLobbyBySocketId(socket);
            if (!room || room.type !== "session") {
                return;
            }

            if (!data || typeof data !== "object") {
                return;
            }

            const payload = {
                playerId: socket.id,
                type: Number(data.type),
                rotation: Number(data.rotation),
                x: Number(data.x),
                y: Number(data.y),
                color: data.color
            };

            if (!Number.isFinite(payload.type)
                || !Number.isFinite(payload.rotation)
                || !Number.isFinite(payload.x)
                || !Number.isFinite(payload.y)
                || typeof payload.color !== "string") {
                return;
            }

            const playerField = sessionService.getPlayerField(room.data, payload.playerId);
            if (playerField) {
                const newPlayerField = applyLockedBlockToField(playerField, payload);
                const updateSuccess = sessionService.updatePlayerField(room.data, payload.playerId, newPlayerField);
                if (updateSuccess) {
                    socket.to(room.id).emit("blockLocked", payload);
                }
            }
        });

        socket.on("disconnecting", () => {
            const room = getLobbyBySocketId(socket);
            if (!room) {
                return;
            }

            if (room.type == "lobby") {
                    // remove the player from the lobby and delete the lobby if it becomes empty
                lobbyService.leaveLobby(lobbys, room.data.id, socket.id);

                // notify remaining players in the lobby about the departure
                io.to(room.data.id).emit("playerLeft", socket.id);
                return;
            } else {
                sessionService.leaveSession(sessions, room.data.id, socket.id);
                if (room.data.fields) {
                    delete room.data.fields[socket.id];
                }

                // notify remaining players in the session about the departure
                io.to(room.data.id).emit("playerLeft", socket.id);
            }

        });
    });
};

function getLobbyBySocketId(socket) {
    const joinedRoomIds = [...socket.rooms].filter((roomId) => roomId !== socket.id);

    const lobbyId = joinedRoomIds.find((roomId) => Boolean(lobbys[roomId]));
    if (lobbyId) {
        return { 
            type: "lobby",
            id: lobbyId,
            data: lobbys[lobbyId],
        };
    }

    const sessionId = joinedRoomIds.find((roomId) => Boolean(sessions[roomId]));
    if (sessionId) {
        return {
            type: "session",
            id: sessionId,
            data: sessions[sessionId],
        };
    }

    return null;
}