const lobbyService = require("../services/lobbyService");
const sessionService = require("../services/sessionService");
const { getLobbyBySocketId } = require("./generalEventHandling");

function registerEvents(socket, io) {
    socket.on("joinLobby", (data, ack) => {
        const lobby = lobbyService.joinLobby(global.lobbys, socket);
        const playerId = socket.user?.username || socket.id;

        io.to(lobby.id).emit("newConnection", playerId);
        socket.join(lobby.id);

        if (typeof ack === "function") {
            ack(lobbyService.getAllPlayers(lobby));
        }
    });

    socket.on("migrateToSession", () => {
        const room = getLobbyBySocketId(socket);
        if (!room || room.type !== "lobby") return;

        const sessionId = sessionService.migrateLobbyToSession(room.data, global.sessions);
        io.to(room.id).emit("sessionMigrated", {
            id: sessionId,
            password: global.sessions[sessionId].password,
            playerAmount: room.data.getAllPlayers().length
        });
    });
}

module.exports = { registerEvents };