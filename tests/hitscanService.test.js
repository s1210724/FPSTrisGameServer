const hitscanService = require("../src/services/hitscanService");
const { sessionModel } = require("../src/models/sessionModel");

describe("hitscanService", () => {
    test("validateHitscanShot returns true for a valid hit", () => {
        const origin = { x: 0, y: 0, z: 0 };
        const direction = { x: 1, y: 0, z: 0 };
        const target = { x: 5, y: 0, z: 0 };
        expect(hitscanService.validateHitscanShot(origin, direction, target)).toBe(true);
    });

    test("validateHitscanShot returns false for invalid direction", () => {
        const origin = { x: 0, y: 0, z: 0 };
        const direction = { x: 0, y: 0, z: 0 };
        const target = { x: 5, y: 0, z: 0 };
        expect(hitscanService.validateHitscanShot(origin, direction, target)).toBe(false);
    });

    test("validateHitscanShot returns false for a target behind shooter", () => {
        const origin = { x: 0, y: 0, z: 0 };
        const direction = { x: 1, y: 0, z: 0 };
        const target = { x: -5, y: 0, z: 0 };
        expect(hitscanService.validateHitscanShot(origin, direction, target)).toBe(false);
    });

    test("validateHitscanShot returns false for a target behind shooter", () => {
        const origin = { x: 0, y: 0, z: 0 };
        const direction = { x: 1, y: 0, z: 0 };
        const target = { x: -5, y: 0, z: 0 };
        expect(hitscanService.validateHitscanShot(origin, direction, target)).toBe(false);
    });

    test("createHitResultPayload returns structured payload", () => {
        expect(hitscanService.createHitResultPayload("shooter-1")).toEqual({ hit: true, shooterId: "shooter-1" });
    });

    test("endDuel removes duel from duels map", () => {
        const duels = { d1: { players: {} } };
        const io = { sockets: { sockets: new Map() } };

        hitscanService.endDuel(io, duels, "d1");
        expect(duels.d1).toBeUndefined();
    });

    test("resolveHitscanStatus updates session states and clears field", () => {
        const session = new sessionModel("s1", { getAllPlayers: () => ["a", "b"] }, "pass");
        session.addPlayer({ id: "shooter" });
        session.addPlayer({ id: "opponent" });
        session.setPlayerState("opponent", "alive");

        const result = hitscanService.resolveHitscanStatus(session, "shooter", "opponent");
        expect(result).toBe(true);
        expect(session.getPlayerState("shooter")).toBe("revived");
        expect(session.getPlayerState("opponent")).toBe("gameOver");
    });
});