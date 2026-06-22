import { Router } from "express";
import {
  authController,
  boardingHouseController,
  roomTypeController,
  ReviewController,
} from "../controllers/index.js";
import appointmentController from "../controllers/appointmentController.js";
import roomController from "../controllers/roomController.js";
import { authMiddleware } from "../middlewares/index.js";

const commonRouter = Router();

/* =========================
   AUTH
========================= */

commonRouter.post("/login", authController.login);
commonRouter.post("/forgot-password", authController.forgotPassword);
commonRouter.post("/reset-password", authController.resetPassword);
commonRouter.post("/send-otp-register", authController.sendOTPRegister);
commonRouter.post("/verify-register", authController.verifyRegister);

/* =========================
   BOARDING HOUSE
========================= */

commonRouter.get(
  "/boardinghouse",
  boardingHouseController.getAllBoardingHousesForGuest
);

commonRouter.get(
  "/boardinghouse/highrating",
  boardingHouseController.getHighRatingBH
);

commonRouter.get(
  "/boardinghouse/newest",
  boardingHouseController.getNewestBH
);

commonRouter.get(
  "/boardinghouse/room-types/:id",
  roomTypeController.getRoomTypeByBhId
);

commonRouter.get(
  "/boardinghouse/:id",
  boardingHouseController.getBoardingHouseDetailInUser
);

/* =========================
   APPOINTMENT
========================= */

commonRouter.post(
  "/appointments",
  authMiddleware,
  appointmentController.createAppointment
);
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

/* =========================
   REVIEW
========================= */

commonRouter.get(
  "/boardinghouse/reviews/:id",
  ReviewController.getReviewByBhId
);

/* =========================
   ROOM
========================= */

commonRouter.get(
  "/room-types/:roomTypeId/rooms",
  roomController.getRoomsByRoomType
);

commonRouter.get(
  "/rooms/:roomId",
  roomController.getRoomDetails
);

export { commonRouter };
