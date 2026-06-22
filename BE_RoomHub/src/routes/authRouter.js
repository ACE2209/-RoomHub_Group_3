import { Router } from "express";

import {
  authController,
  accountController,
  reportController,
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
authRouter.post("/change-password", accountController.changePassword);
authRouter.post("/send-otp-change-email", accountController.sendOTPChangeEmail);
authRouter.post("/verify-change-email", accountController.verifyChangeEmail);
authRouter.get("/reports", reportController.getOwnReports.bind(reportController));
authRouter.get("/reports/exist", reportController.checkReportExist.bind(reportController));
authRouter.get("/reports/:reportId", reportController.getOwnReportDetail.bind(reportController));
authRouter.post("/reports", upload.array("report", 5), reportController.createReport);

export { authRouter };
