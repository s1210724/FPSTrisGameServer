const hitscanService = require("../services/hitscanService");
const sessionService = require("../services/sessionService");
const duelService = require("../services/duelService");
const { getLobbyBySocketId, endDuel } = require("./generalEventHandling");

function registerEvents(socket, io) {
    socket.on("joinDuel", (data, ack) => {
        const { duelId, password } = data || {};
        const duel = duelService.joinDuel(global.duels, socket, duelId, password);

        if (!duel) {
            if (typeof ack === "function") ack({ error: "Duel not found or invalid password" });
            return;
        }

        socket.join(duelId);
        if (typeof ack === "function") ack({ playerId: socket.id });

        const playerCount = Object.keys(duel.players).length;
        if (playerCount === 2) {
            io.to(duelId).emit("duelReady", {
                duelId,
                players: Object.keys(duel.players)
            });
        }
    });

    socket.on("updatePlayerPos", (location) => {
        const room = getLobbyBySocketId(socket);
        if (!room || (room.type !== "session" && room.type !== "duel")) return;
        if (!location || typeof location !== "object") return;

        const payload = {
            playerId: socket.id,
            x: Number(location.x),
            y: Number(location.y),
            z: Number(location.z),
            yaw: Number(location.yaw),
            pitch: Number(location.pitch)
        };

        if (![payload.x, payload.y, payload.z, payload.yaw, payload.pitch].every(Number.isFinite)) return;

        if (room.type === "duel") {
            duelService.updatePlayerLocation(global.duels, socket, room.id, payload);
        }

        socket.to(room.id).emit("updatePlayerPos", payload);
    });

    socket.on("hitscanShot", (shotData, ack) => {
        const room = getLobbyBySocketId(socket);
        if (!room || room.type !== "duel") {
            if (typeof ack === "function") ack({ hit: false, error: "Not currently in a duel" });
            return;
        }

        const duel = room.data;
        const shooterId = socket.id;
        const opponentId = Object.keys(duel.players).find((id) => id !== shooterId);
        if (!opponentId) {
            if (typeof ack === "function") ack({ hit: false, error: "No opponent found" });
            return;
        }

        const shooter = duel.players[shooterId];
        const target = duel.players[opponentId];
        if (!shooter || !target) {
            if (typeof ack === "function") ack({ hit: false, error: "Invalid duel players" });
            return;
        }

        if (!shotData || typeof shotData !== "object" || !shotData.origin || !shotData.direction) {
            if (typeof ack === "function") ack({ hit: false, error: "Invalid shot data" });
            return;
        }

        const origin = shotData.origin;
        const direction = shotData.direction;
        const hit = hitscanService.validateHitscanShot(origin, direction, target.location);
        if (!hit) {
            if (typeof ack === "function") ack({ hit: false });
            return;
        }

        const session = require("./generalEventHandling").getSessionForSocket(socket);
        const hitResolved = hitscanService.resolveHitscanStatus(session, shooterId, opponentId);
        if (!hitResolved) {
            if (typeof ack === "function") ack({ hit: false, error: "Could not resolve hit status" });
            return;
        }

        const resultPayload = hitscanService.createHitResultPayload(shooterId);
        io.to(room.id).emit("hitResult", resultPayload);
        if (session) {
            io.to(session.id).emit("sessionState", sessionService.getPlayerFields(session));
        }
        endDuel(io, room.id);

        if (typeof ack === "function") ack({ hit: true, targetId: opponentId });
    });
}

module.exports = { registerEvents };