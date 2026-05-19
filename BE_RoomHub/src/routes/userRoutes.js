const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateStatusUser,
  changePassword,
  updateUser,
} = require("../controllers/userController");
const { uploadAvatar } = require("../middleware/uploadMiddleware");
const {
  verifyToken,
  adminMiddleware,
  canModifyUser,
} = require("../middleware/authMiddleware");

router.get("/", verifyToken, adminMiddleware, getAllUsers);
router.get("/:userId", verifyToken, canModifyUser, getUserById);
router.put("/:userId/status", verifyToken, canModifyUser, updateStatusUser);
router.put(
  "/:userId/change-password",
  verifyToken,
  canModifyUser,
  changePassword
);
router.put(
  "/:userId",
  verifyToken,
  canModifyUser,
  uploadAvatar.single("avatar"),
  updateUser
);

router.use((error, req, res, next) => {
  if (error instanceof Error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
  next();
});

module.exports = router;
