const { applyLockedBlockToField, clearLines } = require("../src/public/js/shared/fieldSync");
const TetrisHelpers = require("../src/public/js/shared/tetrisHelpers");

describe("fieldSync", () => {
    test("clearLines removes completed rows", () => {
        const field = TetrisHelpers.createEmptyField();
        field[19] = Array(10).fill(1);
        clearLines(field);
        expect(field[19].every((cell) => cell === 0)).toBe(true);
        expect(field).toHaveLength(20);
    });

    test("applyLockedBlockToField updates field and clears lines", () => {
        const field = TetrisHelpers.createEmptyField();
        const payload = {
            type: 1,
            rotation: 0,
            x: 0,
            y: 0,
            color: "#FF0000"
        };
        const result = applyLockedBlockToField(field, payload);
        expect(result[0][0]).toBe("#FF0000");
    });

    test("applyLockedBlockToField returns original field for invalid payload", () => {
        const field = TetrisHelpers.createEmptyField();
        const result = applyLockedBlockToField(field, { type: 99, rotation: 0, x: 0, y: 0, color: "red" });
        expect(result).toBe(field);
    });
});