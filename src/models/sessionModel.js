class sessionModel {
    #players = [];

    constructor(id, lobbyData , password) {
        this.id = id;
        this.password = password;
        this.#players = {};
        this.#fillPlayerData(lobbyData);
    }

    #fillPlayerData(lobbyData) {
        let players = lobbyData.getAllPlayers();
        players.forEach(socket => {
            this.#players[socket] = {
                id: socket,
                score: 0,
                board: [],
            };
        });
    }

}

module.exports = { sessionModel };