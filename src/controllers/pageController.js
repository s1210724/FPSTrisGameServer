const path = require("path");
const pageService = require("../services/pageService");

exports.getHomePage = (req, res) => {
    res.sendFile(path.join(__dirname, "../views/index.html"));
};

exports.getGamePage = (req, res) => {
    res.sendFile(path.join(__dirname, "../views/game.html"));
};