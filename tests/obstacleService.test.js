const obstacleService = require("../src/services/obstacleService");

describe("obstacleService", () => {
    test("createObstacleLayout returns the expected number of obstacles", () => {
        const obstacles = obstacleService.createObstacleLayout(5);
        expect(Array.isArray(obstacles)).toBe(true);
        expect(obstacles).toHaveLength(5);
        obstacles.forEach((item, index) => {
            expect(item).toHaveProperty("id", `obstacle-${index}`);
            expect(Array.isArray(item.blocks)).toBe(true);
            expect(item.blocks.length).toBeGreaterThan(0);
            item.blocks.forEach((block) => {
                expect(typeof block.x).toBe("number");
                expect(typeof block.y).toBe("number");
                expect(typeof block.z).toBe("number");
            });
        });
    });

    test("createObstacleLayout defaults to 8 items", () => {
        const obstacles = obstacleService.createObstacleLayout();
        expect(obstacles).toHaveLength(8);
    });
});