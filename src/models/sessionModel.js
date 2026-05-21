const { createEmptyField } = require("../public/js/shared/tetrisHelpers");

class sessionModel {
    #players = [];

    constructor(id, lobbyData , password) {
        this.id = id;
        this.password = password;
        this.amountOfPlayers = lobbyData.getAllPlayers().length;
        this.#players = {};
    }

    addPlayer(socket) {
        // standard row and cols for tetris
        const ROWS = 20;
        const COLS = 10;

        // add player to session with initial score of 0, empty board, and alive state
        this.#players[socket.id] = {
            id: socket.id,
            score: 0,
            board: Array.from({ length: ROWS }, () => Array(COLS).fill(0)),
            state: "alive"
        };

        return this.checkIfAllPlayersJoined();
    }

    setPlayerState(playerId, state) {
        if (playerId in this.#players) {
            this.#players[playerId].state = state;
            return true;
        }
        return false;
    }

    getPlayerState(playerId) {
        if (playerId in this.#players) {
            return this.#players[playerId].state;
        }
        return null;
    }

    getPlayersByState(state) {
        return Object.entries(this.#players)
            .filter(([, playerData]) => playerData.state === state)
            .map(([playerId]) => playerId);
    }

    getPlayersByStates(states) {
        return Object.entries(this.#players)
            .filter(([, playerData]) => states.includes(playerData.state))
            .map(([playerId]) => playerId);
    }

    updatePlayerScore(socketId, score) {
        if (socketId in this.#players) {
            this.#players[socketId].score = Math.max(this.#players[socketId].score, score);
        }
    }

    getHighScoreString() {
        const playerWithHighScore = Object.values(this.#players).reduce((maxPlayer, player) => {
            return player.score > maxPlayer.score ? player : maxPlayer;
        }, { score: 0 });
        return `${playerWithHighScore.id} had the highscore with ${playerWithHighScore.score} points!`;
    }

    getTopPlayersByScore(limit = 5) {
        return Object.values(this.#players)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map((playerData) => ({
                playerId: playerData.id,
                score: playerData.score,
                state: playerData.state
            }));
    }

    checkIfAllPlayersJoined() {
        return this.getAmountOfPlayers() == this.amountOfPlayers;
    }

    getAmountOfPlayers() {
        return Object.keys(this.#players).length;
    }

    removePlayer(socketId) {
        if (socketId in this.#players) {
            delete this.#players[socketId];
            return true;
        }
        return false;
    }

    getAllPlayers() {
        return Object.keys(this.#players);
    }

    getPlayerField(playerId) {
        if (playerId in this.#players) {
            return this.#players[playerId].board;
        }
        return null;
    }

    clearPlayerField(playerId) {
        if (playerId in this.#players) {
            this.#players[playerId].board = createEmptyField();
            return true;
        }
        return false;
    }

    getPlayerFields() {
        if (Object.keys(this.#players).length === 0) {
            return null;
        }
        const fields = {};
        Object.entries(this.#players).forEach(([playerId, playerData]) => {
            fields[playerId] = playerData.board;
        });
        return fields;
    }

    updatePlayerField(playerId, field) {
        if (playerId in this.#players) {
            this.#players[playerId].board = field;
            return true;
        }        
        return false;
    }
}

module.exports = { sessionModel };