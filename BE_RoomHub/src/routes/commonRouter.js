import { Router } from "express";
import {
  authController,
  boardingHouseController,
  roomTypeController,
  appointmentController,
  ReviewController,
  reportController,
  monthlyRentController,
} from "../controllers/index.js";

import roomController from "../controllers/roomController.js";
import { authMiddleware } from "../middlewares/index.js";

const commonRouter = Router();
// auth
commonRouter.post("/login", authController.login);
commonRouter.post("/forgot-password", authController.forgotPassword);
commonRouter.post("/reset-password", authController.resetPassword);
commonRouter.post("/send-otp-register", authController.sendOTPRegister);
commonRouter.post("/verify-register", authController.verifyRegister);

commonRouter.post("/reports", authMiddleware, reportController.createReport);

commonRouter.get("/boardinghouse", boardingHouseController.getAllBoardingHousesForGuest);
commonRouter.get("/boardinghouse/home/area", boardingHouseController.getBhByArea);
commonRouter.get("/boardinghouse/home/max-price", boardingHouseController.getMaxPriceBH);
commonRouter.get("/boardinghouse/highrating", boardingHouseController.getHighRatingBH);
commonRouter.get("/boardinghouse/newest", boardingHouseController.getNewestBH);
commonRouter.get("/boardinghouse/types", boardingHouseController.getAllBoardingHouseTypes);
commonRouter.get("/boardinghouse/:id", boardingHouseController.getBoardingHouseDetailInUser);
commonRouter.get("/boardinghouse/room-types/:id", roomTypeController.getRoomTypeByBhId);

//review
commonRouter.get("/boardinghouse/:boardingHouseId/reviews", ReviewController.getReviewsByBoardingHouse);
commonRouter.get("/boardinghouse/reviews/:id", ReviewController.getReviewByBhId);
commonRouter.get('/boardinghouse/reviews/:id', ReviewController.getReviewByBhId);

commonRouter.post("/appointments", authMiddleware, appointmentController.createAppointment);
commonRouter.get("/appointments/my", authMiddleware, appointmentController.getAppointmentByUserId);
commonRouter.patch("/appointments/:appointmentId/cancel", authMiddleware, appointmentController.cancelAppointment);

commonRouter.get('/room/room-type/:roomTypeId', roomController.getRoomsByRoomType);

commonRouter.get("/room-types/:roomTypeId/rooms", roomController.getRoomsByRoomType);
commonRouter.get("/rooms/:roomId", roomController.getRoomDetails);

commonRouter.get("/monthly-rents/my", authMiddleware, monthlyRentController.getMyMonthlyRents);
commonRouter.get("/monthly-rents/my/:userPaymentId", authMiddleware, monthlyRentController.getMyMonthlyRentDetail);
commonRouter.patch("/monthly-rents/my/:userPaymentId/pay", authMiddleware, monthlyRentController.payMyMonthlyRent);

export { commonRouter };
