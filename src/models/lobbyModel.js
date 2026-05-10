class lobbyModel {
    #players = [];

    constructor(id, maxPlayers = 56, password = null) {
        this.id = id;
        this.maxPlayers = maxPlayers;
        this.password = password;
        this.locked = false;
        this.#players = [];
    }

    joinPlayer(socket) {
        if (this.#players.length >= this.maxPlayers || this.locked || this.hasPlayer(socket.id)) {
            return false;
        }

        if (socket.user) {
            this.#players.push(socket.user.username);
        } else {
            this.#players.push(socket.id);
        }
        this.checkFull();
        return true;
    }

    leavePlayer(playerId) {
        const beforeCount = this.#players.length;
        this.#players = this.#players.filter((p) => p !== playerId);
        const removed = this.#players.length !== beforeCount;
        if (removed) {
            this.checkFull();
        }
        return removed;
    }

    hasPlayer(playerId) {
        return this.#players.some((p) => p === playerId);
    }

    getAllPlayers() {
        return this.#players;
    }

    checkFull() {
        this.locked = this.#players.length >= this.maxPlayers;
    }
}

module.exports = { lobbyModel };