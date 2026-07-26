const express = require("express");
const {
  registerController,
  loginController,
  profileController,
  updateProfileController,
  changePasswordController,
  logoutController,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const {
  validate,
  registerRules,
  loginRules,
} = require("../middleware/validateMiddleware");
const upload = require("../utils/upload");

const router = express.Router();

// POST /api/v1/auth/register
router.post("/register", registerRules, validate, registerController);

// POST /api/v1/auth/login
router.post("/login", loginRules, validate, loginController);

// GET /api/v1/auth/profile  — protected
router.get("/profile", protect, profileController);

// PUT /api/v1/auth/profile — protected, with avatar upload
router.put("/profile", protect, upload.single("avatar"), updateProfileController);

// PUT /api/v1/auth/password — protected
router.put("/password", protect, changePasswordController);

// POST /api/v1/auth/logout  — protected
router.post("/logout", protect, logoutController);

module.exports = router;
