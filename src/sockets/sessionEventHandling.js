const sessionService = require("../services/sessionService");
const duelService = require("../services/duelService");
const obstacleService = require("../services/obstacleService");
const { applyLockedBlockToField } = require("../public/js/shared/fieldSync");
const { getLobbyBySocketId, finalizeSession } = require("./generalEventHandling");

function registerEvents(socket, io) {
    socket.on("joinSession", (data, ack) => {
        const { sessionId, password } = data;
        const allJoined = sessionService.joinSession(socket, sessionId, global.sessions);
        const session = global.sessions[sessionId];

        if (!session) {
            if (typeof ack === "function") ack({ error: "Session not found" });
            return;
        }

        if (session.password !== password) {
            if (typeof ack === "function") ack({ error: "Incorrect password" });
            return;
        }

        socket.join(sessionId);
        if (typeof ack === "function") ack(socket.id);

        const allPlayerFields = sessionService.getPlayerFields(session);
        socket.emit("sessionState", allPlayerFields);

        if (allJoined) {
            io.to(sessionId).emit("sessionReady", sessionService.getAllPlayers(session));
            io.to(sessionId).emit("sessionState", allPlayerFields);
        }
    });

    socket.on("playerLost", (data) => {
        const room = getLobbyBySocketId(socket);
        if (!room || room.type !== "session") return;

        const session = room.data;
        const playerId = socket.id;
        const currentState = sessionService.getPlayerState(session, playerId);

        if (currentState === "revived" || currentState === "lost" || currentState === "gameOver") {
            sessionService.setPlayerState(session, playerId, "gameOver");
            const activePlayers = sessionService.getPlayersByStates(session, ["alive", "revived"]);
            if (activePlayers.length === 0) {
                finalizeSession(io, session);
            } else {
                socket.emit("finalGameOver");
            }
            return;
        }

        const availableDuelPlayers = sessionService.getAvailableDuelPlayers(session)
            .filter((id) => id !== playerId);
        const hasEligiblePartner = availableDuelPlayers.length > 0;

        if (!hasEligiblePartner) {
            sessionService.setPlayerState(session, playerId, "gameOver");
            finalizeSession(io, session);
            socket.emit("finalGameOver");
            return;
        }

        sessionService.setPlayerState(session, playerId, "reviving");
        socket.emit("waitingForDuel");

        const waitingPlayers = sessionService.getPlayersByState(session, "reviving")
            .filter((id) => id !== playerId);
        if (waitingPlayers.length === 0) return;

        const otherPlayerId = waitingPlayers[0];
        const duel = duelService.createDuel();
        duel.obstacles = obstacleService.createObstacleLayout();
        global.duels[duel.id] = duel;

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

    socket.on("updateScore", (score) => {
        const room = getLobbyBySocketId(socket);
        if (!room || room.type !== "session") return;
        const HighScoreString = sessionService.updatePlayerScore(socket, score, room.data);
        io.to(room.id).emit("updateScore", HighScoreString);
    });

    socket.on("blockLocked", (data) => {
        const room = getLobbyBySocketId(socket);
        if (!room || room.type !== "session") return;
        if (!data || typeof data !== "object") return;

        const payload = {
            playerId: socket.id,
            type: Number(data.type),
            rotation: Number(data.rotation),
            x: Number(data.x),
            y: Number(data.y),
            color: data.color
        };

        if (![payload.type, payload.rotation, payload.x, payload.y].every(Number.isFinite) ||
            typeof payload.color !== "string") return;

        const playerField = sessionService.getPlayerField(room.data, payload.playerId);
        if (playerField) {
            const newPlayerField = applyLockedBlockToField(playerField, payload);
            const updateSuccess = sessionService.updatePlayerField(room.data, payload.playerId, newPlayerField);
            if (updateSuccess) socket.to(room.id).emit("blockLocked", payload);
        }
    });
}

module.exports = { registerEvents };