const sessionService = require("./sessionService");

function normalizeVector(vector) {
    const x = Number(vector.x);
    const y = Number(vector.y);
    const z = Number(vector.z);
    const length = Math.hypot(x, y, z);
    if (length === 0 || !Number.isFinite(length)) {
        return null;
    }
    return { x: x / length, y: y / length, z: z / length, length };
}

function validateHitscanShot(origin, direction, target) {
    const normDirection = normalizeVector(direction);
    if (!normDirection) {
        return false;
    }

    const relX = Number(target.x) - Number(origin.x);
    const relY = Number(target.y) - Number(origin.y);
    const relZ = Number(target.z) - Number(origin.z);
    const distance = Math.hypot(relX, relY, relZ);
    if (distance === 0 || !Number.isFinite(distance)) {
        return false;
    }

    const forward = relX * normDirection.x + relY * normDirection.y + relZ * normDirection.z;
    if (forward <= 0) {
        return false;
    }

    const maxRange = 30;
    if (forward > maxRange) {
        return false;
    }

    const perpendicularSq = Math.max(0, distance * distance - forward * forward);
    const hitRadius = 1.2;
    if (Math.sqrt(perpendicularSq) > hitRadius) {
        return false;
    }

    const aimDot = forward / distance;
    const minAimCos = Math.cos(20 * Math.PI / 180);
    return aimDot >= minAimCos;
}

function resolveHitscanStatus(session, shooterId, opponentId) {
    if (!session) {
        return false;
    }

    const shooterStateUpdated = sessionService.setPlayerState(session, shooterId, "revived");
    const opponentStateUpdated = sessionService.setPlayerState(session, opponentId, "gameOver");
    const boardCleared = sessionService.clearPlayerField(session, shooterId);
    return shooterStateUpdated && opponentStateUpdated && boardCleared;
}

function createHitResultPayload(shooterId) {
    return {
        hit: true,
        shooterId
    };
}

function endDuel(io, duels, duelId) {
    const duel = duels[duelId];
    if (!duel) {
        return;
    }

    Object.keys(duel.players).forEach((playerId) => {
        const playerSocket = io.sockets.sockets.get(playerId);
        if (playerSocket) {
            playerSocket.leave(duelId);
        }
    });

    delete duels[duelId];
}

module.exports = {
    validateHitscanShot,
    resolveHitscanStatus,
    createHitResultPayload,
    endDuel
};
