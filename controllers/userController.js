const { asyncHandler } = require("../utils/errorHandler");
const authService = require("../services/authService");

/**
 * POST /api/v1/auth/register
 */
const registerController = asyncHandler(async (req, res) => {
  const { user, token } = await authService.registerUser(req.body);
  res.status(201).json({ success: true, message: "Registration successful.", user, token });
});

/**
 * POST /api/v1/auth/login
 */
const loginController = asyncHandler(async (req, res) => {
  const { user, token } = await authService.loginUser(req.body);
  res.status(200).json({ success: true, message: "Login successful.", user, token });
});

/**
 * GET /api/v1/auth/profile  (protected)
 */
const profileController = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  res.status(200).json({ success: true, user });
});

/**
 * POST /api/v1/auth/logout  (client-side — just acknowledge)
 */
const logoutController = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, message: "Logged out successfully." });
});

/**
 * PUT /api/v1/auth/profile (protected)
 */
const updateProfileController = asyncHandler(async (req, res) => {
  const data = { ...req.body };
  if (req.file) {
    data.avatar = `/uploads/${req.file.filename}`;
  }
  const user = await authService.updateProfile(req.user.id, data);
  res.status(200).json({ success: true, message: "Profile updated successfully.", user });
});

/**
 * PUT /api/v1/auth/password (protected)
 */
const changePasswordController = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    res.status(400);
    throw new Error("Old and new password are required.");
  }
  await authService.changePassword(req.user.id, oldPassword, newPassword);
  res.status(200).json({ success: true, message: "Password changed successfully." });
});

module.exports = { registerController, loginController, profileController, updateProfileController, changePasswordController, logoutController };
