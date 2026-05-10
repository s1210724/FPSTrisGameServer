const express = require("express");
const router = express.Router();

const pageController = require("../controllers/pageController");
const authController = require("../controllers/authController");

router.get("/", pageController.getHomePage);
router.get("/login", pageController.getLoginPage);
router.get("/game", pageController.getGamePage);
router.get("/lobby", pageController.getLobbyPage);
router.get("/apicall", pageController.getApiCallPage);
router.post("/api/auth/login", authController.postLogin);

module.exports = router;