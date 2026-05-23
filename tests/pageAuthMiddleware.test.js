jest.mock("../src/auth/jwtValidator", () => ({
    verifyToken: jest.fn()
}));

const { getCookieValue } = require("../src/middleware/pageAuthMiddleware");

describe("pageAuthMiddleware helper", () => {
    test("getCookieValue extracts cookie value", () => {
        const cookieHeader = "token=abc123; other=xyz";
        expect(getCookieValue(cookieHeader, "token")).toBe("abc123");
    });

    test("getCookieValue returns null when cookie is missing", () => {
        const cookieHeader = "other=xyz; foo=bar";
        expect(getCookieValue(cookieHeader, "token")).toBeNull();
    });
});