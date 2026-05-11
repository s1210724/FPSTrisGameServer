const express = require("express");
const router = express.Router();

const pageController = require("../controllers/pageController");
const authController = require("../controllers/authController");
const { pageAuthMiddleware, pageAdminMiddleware, pageGuestMiddleware } = require("../middleware/pageAuthMiddleware");

router.get("/", pageController.getHomePage);
router.get("/login", pageGuestMiddleware, pageController.getLoginPage);
router.get("/register", pageGuestMiddleware, pageController.getRegisterPage);
router.get("/logged-in", pageAuthMiddleware, pageController.getLoggedInPage);
router.get("/admin", pageAdminMiddleware, pageController.getAdminPage);
router.get("/game", pageController.getGamePage);
router.get("/lobby", pageController.getLobbyPage);
router.get("/apicall", pageController.getApiCallPage);
router.post("/api/auth/register", authController.postRegister);
router.post("/api/auth/login", authController.postLogin);
router.get("/api/auth/user", pageAuthMiddleware, authController.getUser);
router.post("/api/auth/logout", authController.postLogout);

module.exports = router;