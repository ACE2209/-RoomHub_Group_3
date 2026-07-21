import { Router } from "express";

import {
  authController,
  accountController,
  favoriteController,
  reportController,
  ReviewController,
  watchLaterController,
  depositController,
paymentController,
refundRequestController,
renewalController,
} from "../controllers/index.js";
import { upload } from "../config/cloudinary.config.js";
import { userMiddleware } from "../middlewares/index.js";

const authRouter = Router();

authRouter.get("/", (req, res) => {
  res.send("This is an auth router");
});

authRouter.get("/user", authController.getAccountFromToken);
authRouter.post("/change-password", accountController.changePassword);
authRouter.post("/send-otp-change-email", accountController.sendOTPChangeEmail);
authRouter.post("/verify-change-email", accountController.verifyChangeEmail);
authRouter.put("/avatar", upload.single("avatar"), accountController.updateAvatar);

// reports
authRouter.get("/reports", userMiddleware, reportController.getOwnReports.bind(reportController));
authRouter.get("/reports/exist", userMiddleware, reportController.checkReportExist.bind(reportController));
authRouter.get("/reports/:reportId", userMiddleware, reportController.getOwnReportDetail.bind(reportController));
authRouter.post("/reports", userMiddleware, upload.array("report", 5), reportController.createReport.bind(reportController));

// reviews
authRouter.post("/reviews", userMiddleware, ReviewController.addReview);
authRouter.put(
  "/reviews/:reviewId",
  userMiddleware,
  upload.fields([{ name: "images", maxCount: 5 }]),
  ReviewController.updateReview
);
authRouter.get("/reviews", userMiddleware, ReviewController.getReviewsUser);
authRouter.delete("/reviews/:reviewId", userMiddleware, ReviewController.softDeleteOwnReview.bind(ReviewController));
authRouter.get("/review/:reviewId", userMiddleware, ReviewController.getReviewDetail);

// favorites
authRouter.get("/favorites", userMiddleware, favoriteController.getFavorites);
authRouter.get("/favorites/all", userMiddleware, favoriteController.getAllFavorites);
authRouter.post("/favorites", userMiddleware, favoriteController.createFavorite);
authRouter.delete("/favorites/:boardingHouseId", userMiddleware, favoriteController.deleteFavorite);

// Watch later
authRouter.get("/watchlater", userMiddleware, watchLaterController.getWatchLater);
authRouter.post("/watchlater", userMiddleware, watchLaterController.createWatchLater);
authRouter.delete("/watchlater/:boardingHouseId", userMiddleware, watchLaterController.deleteWatchLater);

// profile
authRouter.get("/profile", accountController.getProfile);
authRouter.put("/profile", accountController.updateAccountFromProfile);
// USER DEPOSIT
authRouter.post("/deposits", userMiddleware, depositController.createDeposit);
authRouter.get("/deposits", userMiddleware, depositController.getMyDeposits);
authRouter.post("/deposits/:depositId/pay", userMiddleware, paymentController.payDeposit);
// USER REFUND REQUEST
authRouter.post("/refund-requests", userMiddleware, refundRequestController.createRefundRequest);
authRouter.get("/refund-requests", userMiddleware, refundRequestController.getMyRefundRequests);
authRouter.get(
  "/refund-requests/check-exists/:depositRoomId",
  userMiddleware,
  refundRequestController.checkRefundRequestExists
);
// USER RENT PAYMENT
authRouter.get("/payment-bills", userMiddleware, paymentController.getMyPaymentBills);
authRouter.post("/payment-bills/:billId/pay", userMiddleware, paymentController.payRent);
// USER RENEWAL REQUEST
authRouter.get("/renewal-requests", userMiddleware, renewalController.getMyRenewalRequests);
authRouter.post("/renewal-requests", userMiddleware, renewalController.createRenewalRequest);
export { authRouter };
