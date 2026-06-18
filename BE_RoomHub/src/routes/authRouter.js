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
authRouter.post("/change-password", accountController.changePassword);
authRouter.post("/send-otp-change-email", accountController.sendOTPChangeEmail);
authRouter.post("/verify-change-email", accountController.verifyChangeEmail);

authRouter.put("/avatar", upload.single("avatar"), accountController.updateAvatar);
export { authRouter };
