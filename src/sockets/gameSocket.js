const lobbyService = require("../services/lobbyService");
const sessionService = require("../services/sessionService");
const lobbys = {};
const sessions = {};
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

        socket.on("migrateToSession", () => {
            const lobby = getLobbyBySocketId(socket);
            const sessionId = sessionService.migrateLobbyToSession(lobby, sessions);
            socket.emit("sessionMigrated", {id: sessionId, password: sessions[sessionId].password});
        });

        socket.on("disconnecting", () => {
            const lobby = getLobbyBySocketId(socket);
            if (!lobby) {
                return;
            }

            // remove the player from the lobby and delete the lobby if it becomes empty
            lobbyService.leaveLobby(lobbys, lobby.id, socket.id);

            // notify remaining players in the lobby about the departure
            io.to(lobby.id).emit("playerLeft", socket.id);
        });
    });
};

function getLobbyBySocketId(socket) {
    const joinedLobbyIds = [...socket.rooms].filter((roomId) => roomId !== socket.id);
    const lobbyId = joinedLobbyIds.find((roomId) => Boolean(lobbys[roomId]));
    const lobby = lobbys[lobbyId];
    return lobby;
}