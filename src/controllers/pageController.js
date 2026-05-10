const pageService = require("../services/pageService");

exports.getHomePage = (req, res) => {
    res.sendFile(pageService.getViewPath("index.html"));
};

exports.getLoginPage = (req, res) => {
    res.sendFile(pageService.getViewPath("login.html"));
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

