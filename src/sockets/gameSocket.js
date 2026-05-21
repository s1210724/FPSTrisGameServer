const { get } = require("../app");
const { verifyToken } = require('../auth/jwtValidator');
const { createEmptyField } = require("../public/js/shared/tetrisHelpers");
const { applyLockedBlockToField } = require("../public/js/shared/fieldSync");
const lobbyService = require("../services/lobbyService");
const sessionService = require("../services/sessionService");
const duelService = require("../services/duelService");
const hitscanService = require("../services/hitscanService");
const obstacleService = require("../services/obstacleService");
const lobbys = {};
const sessions = {};
const duels = {};
const snapshotIntervalMs = 5000;

function getSessionForSocket(socket) {
    const joinedRoomIds = [...socket.rooms].filter((roomId) => roomId !== socket.id);
    const sessionId = joinedRoomIds.find((roomId) => Boolean(sessions[roomId]));
    return sessionId ? sessions[sessionId] : null;
}

function endDuel(io, duelId) {
    hitscanService.endDuel(io, duels, duelId);
}

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

function finalizeSession(io, sessions, session) {
    const finalRanking = sessionService.getTopPlayersByScore(session, 5);
    io.to(session.id).emit("finalWinner", { topPlayers: finalRanking });

    const roomSockets = io.sockets.adapter.rooms.get(session.id);
    if (roomSockets) {
        for (const socketId of roomSockets) {
            const s = io.sockets.sockets.get(socketId);
            if (s) {
                s.leave(session.id);
                s.disconnect(true);
            }
        }
    }

    delete sessions[session.id];
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

        socket.on("joinDuel", (data, ack) => {
            const { duelId, password } = data || {};
            const duel = duelService.joinDuel(duels, socket, duelId, password);

            if (!duel) {
                if (typeof ack === "function") {
                    ack({ error: "Duel not found or invalid password" });
                }
                return;
            }

            socket.join(duelId);

            if (typeof ack === "function") {
                ack({ playerId: socket.id });
            }

            const playerCount = Object.keys(duel.players).length;
            if (playerCount === 2) {
                io.to(duelId).emit("duelReady", {
                    duelId,
                    players: Object.keys(duel.players)
                });
            }
        });

        socket.on("playerLost", (data) => {
            const room = getLobbyBySocketId(socket);
            if (!room || room.type !== "session") {
                return;
            }

            const session = room.data;
            const playerId = socket.id;
            const currentState = sessionService.getPlayerState(session, playerId);

            if (currentState === "revived" || currentState === "lost" || currentState === "gameOver") {
                sessionService.setPlayerState(session, playerId, "gameOver");
                socket.emit("finalGameOver");
                return;
            }

            const availableDuelPlayers = sessionService.getAvailableDuelPlayers(session).filter((id) => id !== playerId);
            const hasEligiblePartner = availableDuelPlayers.length > 0;

            if (!hasEligiblePartner) {
                sessionService.setPlayerState(session, playerId, "gameOver");

                finalizeSession(io, sessions, session);

                socket.emit("finalGameOver");
                return;
            }

            sessionService.setPlayerState(session, playerId, "reviving");
            socket.emit("waitingForDuel");

            const waitingPlayers = sessionService.getPlayersByState(session, "reviving").filter((id) => id !== playerId);
            if (waitingPlayers.length === 0) {
                return;
            }

            const otherPlayerId = waitingPlayers[0];
            const duel = duelService.createDuel();
            duel.obstacles = obstacleService.createObstacleLayout();
            duels[duel.id] = duel;

            const payload = {
                duelId: duel.id,
                password: duel.password,
                obstacles: duel.obstacles
            };

            const otherSocket = io.sockets.sockets.get(otherPlayerId);
            if (otherSocket) {
                sessionService.setPlayerState(session, otherPlayerId, "dueling");
                otherSocket.emit("duelCreated", payload);
                otherSocket.emit("waitingForDuel");
            }

            sessionService.setPlayerState(session, playerId, "dueling");
            socket.emit("duelCreated", payload);
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

        socket.on("updatePlayerPos", (location) => {
            const room = getLobbyBySocketId(socket);
            if (!room || (room.type !== "session" && room.type !== "duel")) {
                return;
            }

            if (!location || typeof location !== "object") {
                return;
            }

            const payload = {
                playerId: socket.id,
                x: Number(location.x),
                y: Number(location.y),
                z: Number(location.z),
                yaw: Number(location.yaw),
                pitch: Number(location.pitch)
            };

            if (![payload.x, payload.y, payload.z, payload.yaw, payload.pitch].every(Number.isFinite)) {
                return;
            }

            if (room.type === "duel") {
                duelService.updatePlayerLocation(duels, socket, room.id, payload);
            }

            socket.to(room.id).emit("updatePlayerPos", payload);
        });

        socket.on("hitscanShot", (shotData, ack) => {
            const room = getLobbyBySocketId(socket);
            if (!room || room.type !== "duel") {
                console.log(room);
                if (typeof ack === "function") {
                    ack({ hit: false, error: "Not currently in a duel" });
                }
                return;
            }

            const duel = room.data;
            const shooterId = socket.id;
            const opponentId = Object.keys(duel.players).find((id) => id !== shooterId);
            if (!opponentId) {
                if (typeof ack === "function") {
                    ack({ hit: false, error: "No opponent found" });
                }
                return;
            }

            const shooter = duel.players[shooterId];
            const target = duel.players[opponentId];
            if (!shooter || !target) {
                if (typeof ack === "function") {
                    ack({ hit: false, error: "Invalid duel players" });
                }
                return;
            }

            if (!shotData || typeof shotData !== "object" || !shotData.origin || !shotData.direction) {
                if (typeof ack === "function") {
                    ack({ hit: false, error: "Invalid shot data" });
                }
                return;
            }

            const origin = shotData.origin;
            const direction = shotData.direction;
            const hit = hitscanService.validateHitscanShot(origin, direction, target.location);
            if (!hit) {
                if (typeof ack === "function") {
                    ack({ hit: false });
                }
                return;
            }

            const session = getSessionForSocket(socket);
            const hitResolved = hitscanService.resolveHitscanStatus(session, shooterId, opponentId);
            if (!hitResolved) {
                if (typeof ack === "function") {
                    ack({ hit: false, error: "Could not resolve hit status" });
                }
                return;
            }

            const resultPayload = hitscanService.createHitResultPayload(shooterId);
            io.to(room.id).emit("hitResult", resultPayload);
            if (session) {
                io.to(session.id).emit("sessionState", sessionService.getPlayerFields(session));
            }
            hitscanService.endDuel(io, duels, room.id);

            if (typeof ack === "function") {
                ack({ hit: true, targetId: opponentId });
            }
        });

        socket.on('updateScore', (score) => {
            const room = getLobbyBySocketId(socket);
            if (!room || room.type !== "session") {
                return;
            }

            const HighScoreString = sessionService.updatePlayerScore(socket, score, room.data);
            io.to(room.data.id).emit("updateScore", HighScoreString);
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
            }

            if (room.type == "session") {
                sessionService.leaveSession(sessions, room.data.id, socket.id);
                if (room.data.fields) {
                    delete room.data.fields[socket.id];
                }

                // notify remaining players in the session about the departure
                io.to(room.data.id).emit("playerLeft", socket.id);
                return;
            }

            if (room.type == "duel") {
                const duel = room.data;
                Object.keys(duel.players).forEach((playerKey) => {
                    if (duel.players[playerKey]?.socketId === socket.id) {
                        delete duel.players[playerKey];
                    }
                });

                if (Object.keys(duel.players).length === 0) {
                    delete duels[room.data.id];
                } else {
                    io.to(room.data.id).emit("playerLeft", socket.id);
                }
                return;
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

    const duelId = joinedRoomIds.find((roomId) => Boolean(duels[roomId]));
    if (duelId) {
        return {
            type: "duel",
            id: duelId,
            data: duels[duelId],
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