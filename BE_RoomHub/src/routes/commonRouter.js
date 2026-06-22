import { Router } from "express";
import {
  authController,
  boardingHouseController,
  roomTypeController,
  appointmentController,
  ReviewController,
  reportController,
} from "../controllers/index.js";
import { authMiddleware } from "../middlewares/index.js";

const commonRouter = Router();

// authentication
commonRouter.post("/login", authController.login);
commonRouter.post("/forgot-password", authController.forgotPassword);
commonRouter.post("/reset-password", authController.resetPassword);
commonRouter.post("/send-otp-register", authController.sendOTPRegister);
commonRouter.post("/verify-register", authController.verifyRegister);

// reports
commonRouter.post("/reports", authMiddleware, reportController.createReport);

// boarding houses
commonRouter.get("/boardinghouse", boardingHouseController.getAllBoardingHousesForGuest);
commonRouter.get("/boardinghouse/highrating", boardingHouseController.getHighRatingBH);
commonRouter.get("/boardinghouse/newest", boardingHouseController.getNewestBH);
commonRouter.get(
  "/boardinghouse/room-types/:id",
  roomTypeController.getRoomTypeByBhId
);
commonRouter.get("/boardinghouse/:id", boardingHouseController.getBoardingHouseDetailInUser);
commonRouter.get(
  "/boardinghouse/:boardingHouseId/reviews",
  ReviewController.getReviewsByBoardingHouse
);
commonRouter.get("/boardinghouse/reviews/:id", ReviewController.getReviewByBhId);

// appointments
commonRouter.post("/appointments", authMiddleware, appointmentController.createAppointment);
commonRouter.get(
  "/appointments/my",
  authMiddleware,
  appointmentController.getAppointmentByUserId
);
commonRouter.patch(
  "/appointments/:appointmentId/cancel",
  authMiddleware,
  appointmentController.cancelAppointment
);

export { commonRouter };
