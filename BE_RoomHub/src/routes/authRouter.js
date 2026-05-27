import { Router } from "express";

import {
  authController,
  accountController,
  // favoriteController,
  // appointmentController,
  // reportController,
  // ReviewController,
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
// authRouter.get("/favorites", favoriteController.getFavorites);
// authRouter.post("/favorites/create", favoriteController.createFavorite);
// authRouter.delete(
//   "/favorites/:boardingHouseId",
//   favoriteController.deleteFavorite
// );
// authRouter.get("/allfavorites", favoriteController.getAllFavorites);

authRouter.post("/change-password", accountController.changePassword);
authRouter.put("/profile", accountController.updateAccountFromProfile);

authRouter.put(
  "/avatar",
  upload.single("avatar"),
  accountController.updateAvatar
);
// authRouter.put(
//   "/review",
//   upload.single("review"),
//   ReviewController.updateReviewImage
// );

authRouter.post("/send-otp-change-email", accountController.sendOTPChangeEmail);
authRouter.post("/verify-change-email", accountController.verifyChangeEmail);

// //appointment
// authRouter.get(
//   "/appointment/user",
//   appointmentController.getAppointmentByUserId
// );
// authRouter.put(
//   "/appointment/update-status/:id",
//   appointmentController.updateAppointmentStatus
// );

// authRouter.post(
//   "/appointment/create-appointment/",
//   appointmentController.createAppointment
// );
// authRouter.post("/reviews",
//   upload.array("review"),
//   ReviewController.addReview);

// // report
// authRouter.get(
//   "/reports/boarding-house/exist",
//   reportController.checkBHReportExist
// );
// authRouter.get("/reports/exist", reportController.checkReportExist);
// authRouter.post(
//   "/reports",
//   upload.array("report"),
//   reportController.createReport
// );
// authRouter.get("/reports", reportController.getReportByUserId);
// authRouter.get("/reports/:reportId", reportController.getReportReviewDetail);
// authRouter.get('/review-reports', reportController.getReviewReports);

// //review
// authRouter.put(
//   "/reviews/:reviewId",
//   upload.fields([{ name: "images", maxCount: 5 }]),
//   ReviewController.updateReview
// ); authRouter.get("/reviews", ReviewController.getReviewsUser);
// authRouter.delete("/reviews/:reviewId", ReviewController.softDeleteReview);
// authRouter.get('/review/:reviewId', ReviewController.getReviewDetail);

// authRouter.get("/watchlater", watchLaterController.getWatchLater);
// authRouter.get("/watchlater/all", watchLaterController.getAllWatchLater);
// authRouter.post("/watchlater/create", watchLaterController.createWatchLater);
// authRouter.delete(
//   "/watchlater/:watchLaterId",
//   watchLaterController.deleteWatchLater
// );

// // deposit
// authRouter.post("/deposit", depositController.deposit);
// authRouter.get("/deposited-room", depositController.getDepositedRooms);
// authRouter.get(
//   "/deposited-room/:depositRoomId",
//   depositController.getDepositRoom
// );
// authRouter.get(
//   "/deposited-room/detail/:depositRoomId",
//   depositController.getDepositRoomDetail
// );

// //payment
// authRouter.post("/pay-rent", depositController.payRent);
// authRouter.get(
//   "/pay-rent/:depositRoomId",
//   depositController.checkPayRentStatus
// );
// authRouter.post("/pay-deposit", depositController.payDeposit);
// authRouter.get("/user-payment", userPaymentController.getUserPaymentByUserId);
// authRouter.get(
//   "/deposit-payment-bill/:paymentBillId",
//   paymentBillController.getPaymentBillForRent
// );

// // refund request
// authRouter.get("/refund-requests", refundRequestController.getRefundRequests);
// authRouter.post(
//   "/refund-requests",
//   refundRequestController.createRefundRequest
// );
// authRouter.get(
//   "/refund-request/check-exists/:depositRoomId",
//   refundRequestController.checkRefundRequestExists
// );
// authRouter.get(
//   "/refund-request/my-requests",
//   refundRequestController.getMyRefundRequestsSimple
// );

// //renewal
// authRouter.get("/renewal", renewalController.getExtensionRequests);
// authRouter.post("/renewal", renewalController.createExtensionRequest);
// authRouter.put("/renewal/:requestId", renewalController.updateExtensionRequest);

export { authRouter };
