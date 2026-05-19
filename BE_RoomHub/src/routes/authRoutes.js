const express = require("express");
const router = express.Router();
const {
  register,
  login,
  requestPasswordReset,
  requestRefreshToken,
  logout,
  resetPasswordWithOTP,
  verifyOTPRegister,
} = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.get("/login", login);
router.post("/refresh-token", requestRefreshToken);
router.post("/logout", verifyToken, logout);
router.post("/forgot-password", requestPasswordReset);
router.post("/verify-otp-reset", resetPasswordWithOTP);
router.post("/verify-otp-register", verifyOTPRegister);

module.exports = router;
