const { get } = require("../app");
const { verifyToken } = require('../auth/jwtValidator');
const { createEmptyField } = require("../public/js/shared/tetrisHelpers");
const { applyLockedBlockToField } = require("../public/js/shared/fieldSync");
const lobbyService = require("../services/lobbyService");
const sessionService = require("../services/sessionService");
const lobbys = {};
const sessions = {};
const duels = {};
const snapshotIntervalMs = 5000;

function getCookieValue(cookieHeader, cookieName) {
    if (!cookieHeader) {
        return null;
    }

    const cookies = cookieHeader.split(";").map((entry) => entry.trim());
    const match = cookies.find((entry) => entry.startsWith(`${cookieName}=`));
    if (!match) {
        return null;
    }

    return decodeURIComponent(match.slice(cookieName.length + 1));
}

module.exports = (io) => {
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token
                || getCookieValue(socket.request.headers.cookie, "token");

            if (token) {
                const payload = await verifyToken(token);
                console.log('Token verified successfully:', payload);
                socket.user = payload;
            } else {
                console.log("No token provided, allowing guest connection");
            }
            next();
        }
        catch (error) {
            console.error('Token verification failed:', error);
            console.log("Allowing guest connection instead");
            next();
        }
    });

    setInterval(() => {
        Object.values(sessions).forEach((session) => {
            const allPlayerFields = sessionService.getPlayerFields(session);
            if (!session || !allPlayerFields) {
                return;
            }

            io.to(session.id).emit("sessionState", allPlayerFields); 
        });
    }, snapshotIntervalMs);

    io.on("connection", (socket) => {
        // Log if connection is logged in or guest
        if (socket.user) {
            console.log(
                `Player connected: ${socket.user}`
            );
        } else {
            console.log(
                `Guest player connected: ${socket.id} (guest)`
            );
        }


        socket.on("joinLobby", (data, ack) => {
            // add player to a lobby or create one if all are full on none exist
            const lobby = lobbyService.joinLobby(lobbys, socket);

            // notify existing players in the lobby about the new player and then subscribe the new player to the lobby room for future updates
            if (socket.user) {
                io.to(lobby.id).emit("newConnection", socket.user.username);
            } else {
                io.to(lobby.id).emit("newConnection", socket.id);
            }
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

            if (typeof ack === "function") {
                ack(socket.id);
            }

            const allPlayerFields = sessionService.getPlayerFields(session);

            socket.emit("sessionState", allPlayerFields);
            
            if (allJoined) {
                io.to(sessionId).emit("sessionReady", (sessionService.getAllPlayers(session)));
                io.to(sessionId).emit("sessionState", allPlayerFields);
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
                // notify remaining players in the lobby about the departure
                if (socket.user) {
                    lobbyService.leaveLobby(lobbys, room.data.id, socket.user.username);
                    io.to(room.data.id).emit("playerLeft", socket.user.username);
                } else {
                    lobbyService.leaveLobby(lobbys, room.data.id, socket.id);
                    io.to(room.data.id).emit("playerLeft", socket.id);
                }
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