const pageService = require("../services/pageService");

exports.getHomePage = (req, res) => {
    res.sendFile(pageService.getViewPath("index.html"));
};

exports.getGamePage = (req, res) => {
    res.sendFile(pageService.getViewPath("game.html"));
};