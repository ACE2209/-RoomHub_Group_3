import { Router } from "express";
import {
  authController,
  boardingHouseController,
  roomTypeController,
  appointmentController,
  ReviewController,
  reportController,
  monthlyRentController,
  paymentController,
} from "../controllers/index.js";

import roomController from "../controllers/roomController.js";
import { authMiddleware } from "../middlewares/index.js";

const commonRouter = Router();

// ======================
// Auth
// ======================
commonRouter.post("/login", authController.login);
commonRouter.post("/forgot-password", authController.forgotPassword);
commonRouter.post("/reset-password", authController.resetPassword);
commonRouter.post("/send-otp-register", authController.sendOTPRegister);
commonRouter.post("/verify-register", authController.verifyRegister);

// ======================
// Report
// ======================
commonRouter.post("/reports", authMiddleware, reportController.createReport.bind(reportController));

// ======================
// Boarding House
// ======================
commonRouter.get("/boardinghouse", boardingHouseController.getAllBoardingHousesForGuest);
commonRouter.get("/boardinghouse/home/area", boardingHouseController.getBhByArea);
commonRouter.get("/boardinghouse/home/max-price", boardingHouseController.getMaxPriceBH);
commonRouter.get("/boardinghouse/highrating", boardingHouseController.getHighRatingBH);
commonRouter.get("/boardinghouse/newest", boardingHouseController.getNewestBH);
commonRouter.get("/boardinghouse/types", boardingHouseController.getAllBoardingHouseTypes);
commonRouter.get("/boardinghouse/:id", boardingHouseController.getBoardingHouseDetailInUser);
commonRouter.get("/boardinghouse/room-types/:id", roomTypeController.getRoomTypeByBhId);

// ======================
// Reviews
// ======================
commonRouter.get(
  "/boardinghouse/:boardingHouseId/reviews",
  ReviewController.getReviewsByBoardingHouse
);
commonRouter.get(
  "/boardinghouse/reviews/:id",
  ReviewController.getReviewByBhId
);

// ======================
// Appointment
// ======================
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

// ======================
// Room
// ======================
commonRouter.get(
  "/room/room-type/:roomTypeId",
  roomController.getRoomsByRoomType
);
commonRouter.get(
  "/room-types/:roomTypeId/rooms",
  roomController.getRoomsByRoomType
);
commonRouter.get("/rooms/:roomId", roomController.getRoomDetails);

// ======================
// Monthly Rent
// ======================
commonRouter.get(
  "/monthly-rents/my",
  authMiddleware,
  monthlyRentController.getMyMonthlyRents
);
commonRouter.get(
  "/monthly-rents/my/:userPaymentId",
  authMiddleware,
  monthlyRentController.getMyMonthlyRentDetail
);
commonRouter.post(
  "/monthly-rents/my/:userPaymentId/pay",
  authMiddleware,
  paymentController.payUserMonthlyRent
);

// ======================
// Payment Callback
// ======================
commonRouter.get("/payment/vnpay-return", paymentController.vnpayReturn);
commonRouter.get("/payment/zalopay-redirect", paymentController.zalopayRedirect);
commonRouter.post("/payment/zalopay-return", paymentController.zalopayReturn);
export { commonRouter };
