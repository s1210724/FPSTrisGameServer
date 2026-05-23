const { sessionModel } = require("../src/models/sessionModel");

describe("sessionModel", () => {
    test("addPlayer creates a player with alive state", () => {
        const session = new sessionModel("s1", { getAllPlayers: () => ["player-1"] }, "pass");
        expect(session.addPlayer({ id: "player-1" })).toBe(true);
        expect(session.getPlayerState("player-1")).toBe("alive");
    });

    test("setPlayerState and getPlayerState manage state", () => {
        const session = new sessionModel("s2", { getAllPlayers: () => ["player-1"] }, "pass");
        session.addPlayer({ id: "player-1" });

        expect(session.setPlayerState("player-1", "reviving")).toBe(true);
        expect(session.getPlayerState("player-1")).toBe("reviving");
    });

    test("getPlayersByState returns matching keys", () => {
        const session = new sessionModel("s3", { getAllPlayers: () => ["player-1", "player-2"] }, "pass");
        session.addPlayer({ id: "player-1" });
        session.addPlayer({ id: "player-2" });
        session.setPlayerState("player-2", "reviving");

        expect(session.getPlayersByState("reviving")).toEqual(["player-2"]);
    });

    test("getPlayersByStates returns correct multiple states", () => {
        const session = new sessionModel("s4", { getAllPlayers: () => ["p1", "p2"] }, "pass");
        session.addPlayer({ id: "p1" });
        session.addPlayer({ id: "p2" });
        session.setPlayerState("p2", "reviving");

        expect(session.getPlayersByStates(["alive", "reviving"]).sort()).toEqual(["p1", "p2"]);
    });

    test("updatePlayerScore sets the correct highest score", () => {
        const session = new sessionModel("s5", { getAllPlayers: () => ["player-1"] }, "pass");
        session.addPlayer({ id: "player-1" });
        session.updatePlayerScore("player-1", 200);
        expect(session.getTopPlayersByScore(1)[0].score).toBe(200);
    });

    test("getHighScoreString returns the player with the highest score", () => {
        const session = new sessionModel("s6", { getAllPlayers: () => ["a", "b"] }, "pass");
        session.addPlayer({ id: "a" });
        session.addPlayer({ id: "b" });
        session.updatePlayerScore("a", 50);
        session.updatePlayerScore("b", 120);

        expect(session.getHighScoreString()).toContain("b had the highscore with 120 points");
    });

    test("clearPlayerField resets the board to empty field", () => {
        const session = new sessionModel("s7", { getAllPlayers: () => ["player-1"] }, "pass");
        session.addPlayer({ id: "player-1" });
        const field = session.getPlayerField("player-1");
        field[0][0] = 1;

        expect(session.clearPlayerField("player-1")).toBe(true);
        expect(session.getPlayerField("player-1")[0][0]).toBe(0);
    });

    test("getPlayerFields returns all player boards", () => {
        const session = new sessionModel("s8", { getAllPlayers: () => ["player-1"] }, "pass");
        session.addPlayer({ id: "player-1" });
        const fields = session.getPlayerFields();
        expect(fields).toHaveProperty("player-1");
    });

    test("removePlayer deletes a player and getAmountOfPlayers updates", () => {
        const session = new sessionModel("s9", { getAllPlayers: () => ["player-1"] }, "pass");
        session.addPlayer({ id: "player-1" });
        expect(session.removePlayer("player-1")).toBe(true);
        expect(session.getAmountOfPlayers()).toBe(0);
    });
});