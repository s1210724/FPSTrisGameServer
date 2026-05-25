const pageService = require("../services/pageService");
const { getCookieValue } = require("../middleware/pageAuthMiddleware");
const { verifyToken } = require("../auth/jwtValidator");

async function getUsernameFromToken(req) {
    const token = getCookieValue(req.headers.cookie, "token");
    if (!token) {
        return null;
    }

    try {
        const payload = await verifyToken(token);
        return payload?.username || null;
    } catch (_) {
        return null;
    }
}

exports.getHomePage = async (req, res) => {
    const username = await getUsernameFromToken(req);
    res.render("index", { username });
};

exports.getLoginPage = (req, res) => {
    res.render("login", { username: null });
};

exports.getRegisterPage = (req, res) => {
    res.render("register", { username: null });
};

exports.getLoggedInPage = (req, res) => {
    res.sendFile(pageService.getViewPath("logged-in.html"));
};

exports.getAdminPage = (req, res) => {
    res.sendFile(pageService.getViewPath("admin.html"));
};

exports.getGamePage = (req, res) => {
    res.sendFile(pageService.getViewPath("game.html"));
};

exports.getLobbyPage = (req, res) => {
    res.sendFile(pageService.getViewPath("lobby.html"));
};

exports.getApiCallPage = (req, res) => {
    res.sendFile(pageService.getViewPath("apicall.html"));
};

exports.getMultiplayerFpsPage = (req, res) => {
    res.sendFile(pageService.getViewPath("multiplayerfps.html"));
};

