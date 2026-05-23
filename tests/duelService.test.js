const duelService = require("../src/services/duelService");
const { duelModel } = require("../src/models/duelModel");

describe("duelService", () => {
    test("createDuel returns a duel instance with id and password", () => {
        const duel = duelService.createDuel();
        expect(duel).toBeDefined();
        expect(typeof duel.id).toBe("string");
        expect(typeof duel.password).toBe("string");
    });

    test("joinDuel returns duel when correct password is used", () => {
        const duel = new duelModel("d1", "pass");
        const initialSocket = { id: "player-1" };
        duel.addPlayer(initialSocket);
        const duels = { [duel.id]: duel };

        const newSocket = { id: "player-2" };
        const joined = duelService.joinDuel(duels, newSocket, duel.id, "pass");
        expect(joined).toBe(duel);
    });

    test("joinDuel returns null for wrong password", () => {
        const duel = new duelModel("d2", "pass");
        const duels = { [duel.id]: duel };

        const joined = duelService.joinDuel(duels, { id: "player-2" }, duel.id, "wrong");
        expect(joined).toBeNull();
    });

    test("updatePlayerLocation returns false when duel not found", () => {
        expect(duelService.updatePlayerLocation({}, { id: "player-1" }, "missing", { x: 1, y: 0, z: 0 })).toBe(false);
    });

    test("updatePlayerLocation returns true when player location updates successfully", () => {
        const duel = new duelModel("d3", "pass");
        const socket = { id: "player-1" };
        duel.addPlayer(socket);
        const duels = { [duel.id]: duel };

        const result = duelService.updatePlayerLocation(duels, socket, duel.id, { x: 1, y: 2, z: 3, yaw: 0, pitch: 0 });
        expect(result).toBe(true);
        expect(duel.players["player-1"].location).toEqual({ x: 1, y: 2, z: 3, yaw: 0, pitch: 0 });
    });
});