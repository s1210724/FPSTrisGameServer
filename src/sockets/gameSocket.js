const gameService = require("../services/gameService");
const lobbyService = require("../services/lobbyService");
const lobbys = {};
const games = {};
const duels = {};

module.exports = (io) => {
    io.on("connection", (socket) => {
        socket.on("joinLobby", (data, ack) => {
            // add player to a lobby or create one if all are full on none exist
            const lobby = lobbyService.joinLobby(lobbys, socket);

            // notify existing players in the lobby about the new player and then subscribe the new player to the lobby room for future updates
            io.to(lobby.id).emit("newConnection", socket.id);
            socket.join(lobby.id);

            // acknowledge the join with the current player list in the lobby
            if (typeof ack === "function") {
                ack(lobbyService.getAllPlayers(lobby));
            }
        });

        socket.on("disconnecting", () => {
            // find the lobby the player is in 
            const joinedLobbyIds = [...socket.rooms].filter((roomId) => roomId !== socket.id);
            const lobbyId = joinedLobbyIds.find((roomId) => Boolean(lobbys[roomId]));

            // return if no lobby is found
            if (!lobbyId) {
                return;
            }

            // remove the player from the lobby and delete the lobby if it becomes empty
            const lobby = lobbyService.leaveLobby(lobbys, lobbyId, socket.id);
            if (!lobby) {
                return;
            }

            // notify remaining players in the lobby about the departure
            io.to(lobbyId).emit("playerLeft", socket.id);
        });
    });
};