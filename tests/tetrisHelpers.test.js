const TetrisHelpers = require("../src/public/js/shared/tetrisHelpers");

describe("tetrisHelpers", () => {
    test("createEmptyField returns a 20x10 matrix of zeros", () => {
        const field = TetrisHelpers.createEmptyField();
        expect(field).toHaveLength(20);
        expect(field[0]).toHaveLength(10);
        expect(field[0][0]).toBe(0);
    });

    test("rotateClockwise rotates shape correctly", () => {
        const shape = [[1, 0], [1, 1]];
        expect(TetrisHelpers.rotateClockwise(shape)).toEqual([[1, 1], [1, 0]]);
    });

    test("isValidField returns false for invalid field", () => {
        expect(TetrisHelpers.isValidField([])).toBe(false);
        expect(TetrisHelpers.isValidField([Array(10).fill(0)])).toBe(false);
    });

    test("getRotationShape returns a valid rotation matrix", () => {
        const rotationShape = TetrisHelpers.getRotationShape(0, 1);
        expect(rotationShape).toBeDefined();
        expect(Array.isArray(rotationShape)).toBe(true);
    });
});