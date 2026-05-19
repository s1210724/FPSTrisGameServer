const pageService = require("../services/pageService");

exports.getHomePage = (req, res) => {
    res.sendFile(pageService.getViewPath("index.html"));
};

exports.getLoginPage = (req, res) => {
    res.sendFile(pageService.getViewPath("login.html"));
};

exports.getRegisterPage = (req, res) => {
    res.sendFile(pageService.getViewPath("register.html"));
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

