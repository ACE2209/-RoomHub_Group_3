import { Router } from "express";

import {
  authController,
  accountController,
  favoriteController,
  // appointmentController,
  // reportController,
  ReviewController,
  // watchLaterController,
  // depositController,
  // renewalController,
  // userPaymentController,
  // refundRequestController,
  // paymentBillController,
} from "../controllers/index.js";
import { upload } from "../config/cloudinary.config.js";

const authRouter = Router();

authRouter.get("/", (req, res) => {
  res.send("This is an auth router");
});

authRouter.get("/user", authController.getAccountFromToken);
authRouter.post("/change-password", accountController.changePassword);
authRouter.post("/send-otp-change-email", accountController.sendOTPChangeEmail);
authRouter.post("/verify-change-email", accountController.verifyChangeEmail);

authRouter.put("/avatar", upload.single("avatar"), accountController.updateAvatar);

//review
authRouter.post("/reviews", ReviewController.addReview);
authRouter.put("/reviews/:reviewId", upload.fields([{ name: "images", maxCount: 5 }]), ReviewController.updateReview);
authRouter.get("/reviews", ReviewController.getReviewsUser);
authRouter.delete("/reviews/:reviewId", ReviewController.softDeleteReview);
authRouter.get('/review/:reviewId', ReviewController.getReviewDetail);

// Favorites
authRouter.get("/favorites", favoriteController.getFavorites);
authRouter.get("/favorites/all",favoriteController.getAllFavorites);
authRouter.post("/favorites",favoriteController.createFavorite);
authRouter.delete("/favorites/:boardingHouseId",favoriteController.deleteFavorite);
export { authRouter };
