import { Router } from "express";
import {
  authController,
  boardingHouseController,
  roomTypeController,
  appointmentController,
  ReviewController
} from "../controllers/index.js";
import { authMiddleware } from "../middlewares/index.js";
const commonRouter = Router();
// Authentication routes
commonRouter.post("/login", authController.login);
commonRouter.post("/forgot-password", authController.forgotPassword);
commonRouter.post("/reset-password", authController.resetPassword);
commonRouter.post("/send-otp-register", authController.sendOTPRegister);
commonRouter.post("/verify-register", authController.verifyRegister);
// View all boarding houses
commonRouter.get("/boardinghouse", boardingHouseController.getAllBoardingHousesForGuest);
// View high rating boarding houses
commonRouter.get("/boardinghouse/highrating", boardingHouseController.getHighRatingBH);
// View newest boarding houses
commonRouter.get("/boardinghouse/newest", boardingHouseController.getNewestBH);
// View room types by boarding house
commonRouter.get("/boardinghouse/room-types/:id", roomTypeController.getRoomTypeByBhId);
// View boarding house detail
commonRouter.get("/boardinghouse/:id", boardingHouseController.getBoardingHouseDetailInUser);
// appointment
commonRouter.post("/appointments", authMiddleware, appointmentController.createAppointment);
commonRouter.get("/appointments/my", authMiddleware, appointmentController.getAppointmentByUserId);
commonRouter.patch("/appointments/:appointmentId/cancel", authMiddleware, appointmentController.cancelAppointment);
// review 
commonRouter.get('/boardinghouse/reviews/:id', ReviewController.getReviewByBhId);
export { commonRouter };