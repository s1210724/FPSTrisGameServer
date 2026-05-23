const pageService = require("../src/services/pageService");
const path = require("path");

describe("pageService", () => {
    test("getViewPath returns a path that contains the requested view", () => {
        const viewPath = pageService.getViewPath("login.html");
        expect(viewPath).toContain(path.join("public", "views", "login.html"));
    });

    test("getGameData returns expected game metadata", () => {
        const gameData = pageService.getGameData();
        expect(gameData).toEqual({ title: "Clicker Game" });
    });
});