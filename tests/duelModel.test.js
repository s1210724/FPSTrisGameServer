const { duelModel } = require("../src/models/duelModel");

describe("duelModel", () => {
    test("addPlayer adds a player and returns true", () => {
        const duel = new duelModel("d1", "pass");
        expect(duel.addPlayer({ id: "player-1" })).toBe(true);
        expect(duel.getPlayerCount()).toBe(1);
    });

    test("addPlayer returns false when duel is full", () => {
        const duel = new duelModel("d2", "pass");
        duel.addPlayer({ id: "player-1" });
        duel.addPlayer({ id: "player-2" });
        expect(duel.addPlayer({ id: "player-3" })).toBe(false);
    });

    test("updatePlayerLocation updates location when valid", () => {
        const duel = new duelModel("d3", "pass");
        const socket = { id: "player-1" };
        duel.addPlayer(socket);

        expect(duel.updatePlayerLocation("player-1", { x: 1, y: 2, z: 3, yaw: 1, pitch: 0 })).toBe(true);
        expect(duel.players["player-1"].location.x).toBe(1);
    });

    test("updatePlayerLocation returns false for invalid location", () => {
        const duel = new duelModel("d4", "pass");
        const socket = { id: "player-1" };
        duel.addPlayer(socket);

        expect(duel.updatePlayerLocation("player-1", { x: "bad", y: 2, z: 3, yaw: 1, pitch: 0 })).toBe(false);
    });

    test("removePlayer deletes the player and returns true", () => {
        const duel = new duelModel("d5", "pass");
        const socket = { id: "player-1" };
        duel.addPlayer(socket);
        expect(duel.removePlayer("player-1")).toBe(true);
        expect(duel.getPlayerCount()).toBe(0);
    });
});