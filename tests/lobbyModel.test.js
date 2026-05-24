const { lobbyModel } = require("../src/models/lobbyModel");

describe("lobbyModel", () => {
    test("joinPlayer adds a player and returns true", () => {
        const lobby = new lobbyModel("l1", 2);
        const socket = { id: "player-1" };
        expect(lobby.joinPlayer(socket)).toBe(true);
        expect(lobby.getAllPlayers()).toEqual(["player-1"]);
    });

    test("joinPlayer does not add duplicate player", () => {
        const lobby = new lobbyModel("l2", 2);
        lobby.joinPlayer({ id: "player-1" });
        expect(lobby.joinPlayer({ id: "player-1" })).toBe(false);
        expect(lobby.getAllPlayers()).toEqual(["player-1"]);
    });

    test("leavePlayer removes a player and returns true", () => {
        const lobby = new lobbyModel("l3", 2);
        lobby.joinPlayer({ id: "player-1" });
        expect(lobby.leavePlayer("player-1")).toBe(true);
        expect(lobby.getAllPlayers()).toEqual([]);
    });

    test("hasPlayer returns correct boolean", () => {
        const lobby = new lobbyModel("l4", 2);
        lobby.joinPlayer({ id: "player-1" });
        expect(lobby.hasPlayer("player-1")).toBe(true);
        expect(lobby.hasPlayer("player-2")).toBe(false);
    });

    test("checkFull locks the lobby when maxPlayers reached", () => {
        const lobby = new lobbyModel("l5", 1);
        lobby.joinPlayer({ id: "player-1" });
        expect(lobby.locked).toBe(true);
    });
});