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

        // add player to session with initial score of 0 and empty board
        this.#players[socket.id] = {
            id: socket.id,
            score: 0,
            board: Array.from({ length: ROWS }, () => Array(COLS).fill(0))
        };

        return this.checkIfAllPlayersJoined();
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

}

module.exports = { sessionModel };