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
authRouter.get("/reports", reportController.getOwnReports.bind(reportController));
authRouter.get("/reports/exist", reportController.checkReportExist.bind(reportController));
authRouter.get("/reports/:reportId", reportController.getOwnReportDetail.bind(reportController));
authRouter.post("/reports", upload.array("report", 5), reportController.createReport.bind(reportController));

// reviews
authRouter.post("/reviews", ReviewController.addReview);
authRouter.put(
  "/reviews/:reviewId",
  upload.fields([{ name: "images", maxCount: 5 }]),
  ReviewController.updateReview
);
authRouter.get("/reviews", ReviewController.getReviewsUser);
authRouter.delete("/reviews/:reviewId", ReviewController.softDeleteOwnReview.bind(ReviewController));
authRouter.get("/review/:reviewId", ReviewController.getReviewDetail);

// favorites
authRouter.get("/favorites", favoriteController.getFavorites);
authRouter.get("/favorites/all", favoriteController.getAllFavorites);
authRouter.post("/favorites", favoriteController.createFavorite);
authRouter.delete("/favorites/:boardingHouseId", favoriteController.deleteFavorite);

// Watch later
authRouter.get("/watchlater", watchLaterController.getWatchLater);
authRouter.post("/watchlater", watchLaterController.createWatchLater);
authRouter.delete("/watchlater/:boardingHouseId", watchLaterController.deleteWatchLater);

// profile
authRouter.get("/profile", accountController.getProfile);
authRouter.put("/profile", accountController.updateAccountFromProfile);
// USER DEPOSIT
authRouter.post("/deposits", depositController.createDeposit);
authRouter.get("/deposits", depositController.getMyDeposits);
authRouter.post("/deposits/:depositId/pay", paymentController.payDeposit);
// USER REFUND REQUEST
authRouter.post("/refund-requests", refundRequestController.createRefundRequest);
authRouter.get("/refund-requests", refundRequestController.getMyRefundRequests);
authRouter.get("/refund-requests/check-exists/:depositRoomId", refundRequestController.checkRefundRequestExists
);
// USER RENT PAYMENT
authRouter.get("/payment-bills", paymentController.getMyPaymentBills);
authRouter.post("/payment-bills/:billId/pay", paymentController.payRent);
// USER RENEWAL REQUEST
authRouter.get("/renewal-requests", renewalController.getMyRenewalRequests);
authRouter.post("/renewal-requests", renewalController.createRenewalRequest);
export { authRouter };
