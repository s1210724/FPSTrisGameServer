const express = require("express");
const router = express.Router();

const pageController = require("../controllers/pageController");

router.get("/", pageController.getHomePage);
router.get("/game", pageController.getGamePage);
router.get("/lobby", pageController.getLobbyPage);
router.get("/apicall", pageController.getApiCallPage);

module.exports = router;