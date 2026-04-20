const { joinLobby, leaveLobby, getAllPlayers } = require("../src/services/lobbyService");

describe("lobbyService", () => {
    test("joinLobby creates a lobby when none exists and adds the player", () => {
        const lobbys = {};
        const socket = { id: "player-1" };

        const lobby = joinLobby(lobbys, socket);

        expect(lobby).toBeDefined();
        expect(lobby.id).toBeDefined();
        expect(lobbys[lobby.id]).toBe(lobby);
        expect(getAllPlayers(lobby)).toEqual(["player-1"]);
    });

    test("joinLobby reuses existing unlocked lobby", () => {
        const lobbys = {};

        const firstLobby = joinLobby(lobbys, { id: "player-1" });
        const secondLobby = joinLobby(lobbys, { id: "player-2" });

        expect(secondLobby).toBe(firstLobby);
        expect(Object.keys(lobbys)).toHaveLength(1);
        expect(getAllPlayers(firstLobby)).toEqual(["player-1", "player-2"]);
    });

    test("leaveLobby removes player and deletes empty lobby", () => {
        const lobbys = {};
        const lobby = joinLobby(lobbys, { id: "player-1" });

        const result = leaveLobby(lobbys, lobby.id, "player-1");

        expect(result).toBeNull();
        expect(lobbys[lobby.id]).toBeUndefined();
    });

    test("leaveLobby returns null for missing lobby or player", () => {
        const lobbys = {};
        const lobby = joinLobby(lobbys, { id: "player-1" });

        expect(leaveLobby(lobbys, "missing-lobby", "player-1")).toBeNull();
        expect(leaveLobby(lobbys, lobby.id, "missing-player")).toBeNull();
    });
});
