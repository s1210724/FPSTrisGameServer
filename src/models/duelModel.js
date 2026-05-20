class duelModel {

    constructor(id, password) {
        this.id = id;
        this.password = password;
        this.players = {};
    }

    addPlayer(socket) {
        if (Object.keys(this.players).length >= 2) {
            return false;
        }

        const playerKey = socket.id;
        if (this.players[playerKey]) {
            return false;
        }

        this.players[playerKey] = {
            socketId: socket.id,
            username: socket.user?.username || null,
            location: {
                x: 0,
                y: 0,
                z: 0,
                yaw: 0,
                pitch: 0
            }
        };

        return true;
    }

    updatePlayerLocation(socketId, location) {
        const player = this.players[socketId];
        if (!player || typeof location !== "object") {
            return false;
        }

        const x = Number(location.x);
        const y = Number(location.y);
        const z = Number(location.z);
        const yaw = Number(location.yaw);
        const pitch = Number(location.pitch);

        if (![x, y, z, yaw, pitch].every(Number.isFinite)) {
            return false;
        }

        player.location = { x, y, z, yaw, pitch };
        return true;
    }

    removePlayer(socketId) {
        if (this.players[socketId]) {
            delete this.players[socketId];
            return true;
        }
        return false;
    }

    getPlayerCount() {
        return Object.keys(this.players).length;
    }
}

module.exports = { duelModel };