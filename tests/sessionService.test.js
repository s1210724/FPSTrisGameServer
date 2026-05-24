const sessionService = require("../src/services/sessionService");
const { sessionModel } = require("../src/models/sessionModel");

describe("sessionService", () => {
    test("migrateLobbyToSession creates new session and returns id", () => {
        const lobby = { getAllPlayers: () => ["player1", "player2"] };
        const sessions = {};

        const sessionId = sessionService.migrateLobbyToSession(lobby, sessions);

        expect(typeof sessionId).toBe("string");
        expect(sessions[sessionId]).toBeDefined();
        expect(sessions[sessionId].id).toBe(sessionId);
    });

    test("joinSession returns false when session is missing", () => {
        const sessions = {};
        const joined = sessionService.joinSession({ id: "p1" }, "missing", sessions);
        expect(joined).toBeNull();
    });

    test("setPlayerState and getPlayerState work correctly", () => {
        const session = new sessionModel("s1", { getAllPlayers: () => ["p1"] }, "pass");
        session.addPlayer({ id: "player-1" });

        const setResult = sessionService.setPlayerState(session, "player-1", "revived");
        expect(setResult).toBe(true);
        expect(sessionService.getPlayerState(session, "player-1")).toBe("revived");
    });

    test("getPlayersByState and getPlayersByStates return matching players", () => {
        const session = new sessionModel("s2", { getAllPlayers: () => ["p1", "p2"] }, "pass");
        session.addPlayer({ id: "player-1" });
        session.addPlayer({ id: "player-2" });
        session.setPlayerState("player-2", "reviving");

        expect(sessionService.getPlayersByState(session, "alive")).toEqual(["player-1"]);
        expect(sessionService.getPlayersByStates(session, ["alive", "reviving"]).sort()).toEqual([
            "player-1",
            "player-2"
        ]);
    });

    test("getAvailableDuelPlayers returns only alive and reviving players", () => {
        const session = new sessionModel("s3", { getAllPlayers: () => ["p1", "p2", "p3"] }, "pass");
        session.addPlayer({ id: "player-1" });
        session.addPlayer({ id: "player-2" });
        session.addPlayer({ id: "player-3" });
        session.setPlayerState("player-2", "reviving");
        session.setPlayerState("player-3", "gameOver");

        expect(sessionService.getAvailableDuelPlayers(session).sort()).toEqual([
            "player-1",
            "player-2"
        ]);
    });

    test("leaveSession removes session when empty", () => {
        const sessions = {};
        const session = new sessionModel("s4", { getAllPlayers: () => ["p1"] }, "pass");
        session.addPlayer({ id: "player-1" });
        sessions[session.id] = session;

        const result = sessionService.leaveSession(sessions, session.id, "player-1");
        expect(result).toBeNull();
        expect(sessions[session.id]).toBeUndefined();
    });

    test("updatePlayerScore updates highest score and returns highscore string", () => {
        const session = new sessionModel("s5", { getAllPlayers: () => ["p1", "p2"] }, "pass");
        session.addPlayer({ id: "player-1" });
        session.addPlayer({ id: "player-2" });

        const highScoreString = sessionService.updatePlayerScore({ id: "player-2" }, 500, session);
        expect(highScoreString).toContain("player-2");
        expect(highScoreString).toContain("500");
    });

    test("getPlayerField, getPlayerFields, updatePlayerField, clearPlayerField work as expected", () => {
        const session = new sessionModel("s6", { getAllPlayers: () => ["p1"] }, "pass");
        session.addPlayer({ id: "player-1" });

        const field = sessionService.getPlayerField(session, "player-1");
        expect(field).toHaveLength(20);

        const fields = sessionService.getPlayerFields(session);
        expect(Object.keys(fields)).toEqual(["player-1"]);

        const newField = Array.from({ length: 20 }, () => Array(10).fill(9));
        expect(sessionService.updatePlayerField(session, "player-1", newField)).toBe(true);
        expect(sessionService.getPlayerField(session, "player-1")[0][0]).toBe(9);

        expect(sessionService.clearPlayerField(session, "player-1")).toBe(true);
        expect(sessionService.getPlayerField(session, "player-1")[0][0]).toBe(0);
    });

    test("getTopPlayersByScore returns sorted top scores", () => {
        const session = new sessionModel("s7", { getAllPlayers: () => ["p1", "p2", "p3"] }, "pass");
        session.addPlayer({ id: "player-1" });
        session.addPlayer({ id: "player-2" });
        session.addPlayer({ id: "player-3" });
        session.updatePlayerScore("player-1", 100);
        session.updatePlayerScore("player-2", 200);
        session.updatePlayerScore("player-3", 150);

        const topPlayers = sessionService.getTopPlayersByScore(session, 2);
        expect(topPlayers).toHaveLength(2);
        expect(topPlayers[0].playerId).toBe("player-2");
        expect(topPlayers[1].playerId).toBe("player-3");
    });
});