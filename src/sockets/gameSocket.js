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

        socket.on("joinSession", (data, ack) => {
            const { sessionId, password } = data;
            const session = sessions[sessionId];

            if (!session) {
                if (typeof ack === "function") {
                    ack({ error: "Session not found" });
                }
                return;
            }

            if (session.password !== password) {
                if (typeof ack === "function") {
                    ack({ error: "Incorrect password" });
                }
                return;
            }

            socket.join(sessionId);
            if (typeof ack === "function") {
                ack('succ6');
            }
        });

        socket.on("migrateToSession", () => {
            const room = getLobbyBySocketId(socket);
            if (!room || room.type !== "lobby") {
                return;
            }

            const sessionId = sessionService.migrateLobbyToSession(room.data, sessions);
            socket.emit("sessionMigrated", {id: sessionId, password: sessions[sessionId].password});
        });

        socket.on("disconnecting", () => {
            const room = getLobbyBySocketId(socket);
            if (!room) {
                return;
            }

            if (room.type !== "lobby") {
                return;
            }

            // remove the player from the lobby and delete the lobby if it becomes empty
            lobbyService.leaveLobby(lobbys, room.data.id, socket.id);

            // notify remaining players in the lobby about the departure
            io.to(room.data.id).emit("playerLeft", socket.id);
        });
    });
};

function getLobbyBySocketId(socket) {
    const joinedRoomIds = [...socket.rooms].filter((roomId) => roomId !== socket.id);

    const lobbyId = joinedRoomIds.find((roomId) => Boolean(lobbys[roomId]));
    if (lobbyId) {
        return { 
            type: "lobby",
            id: lobbyId,
            data: lobbys[lobbyId],
        };
    }

    const sessionId = joinedRoomIds.find((roomId) => Boolean(sessions[roomId]));
    if (sessionId) {
        return {
            type: "session",
            id: sessionId,
            data: sessions[sessionId],
        };
    }

    return null;
}