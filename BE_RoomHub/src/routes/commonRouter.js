import { Router } from 'express';
import {
  authController,
} from '../controllers/index.js';
import reportController from '../controllers/reportController.js';
import appointmentController from "../controllers/appointmentController.js";
import { authMiddleware } from '../middlewares/index.js';
import roomController from "../controllers/roomController.js";
const commonRouter = Router();

//auth
commonRouter.post('/login', authController.login);
commonRouter.post('/forgot-password', authController.forgotPassword);
commonRouter.post('/reset-password', authController.resetPassword);
commonRouter.post('/send-otp-register', authController.sendOTPRegister);
commonRouter.post('/verify-register', authController.verifyRegister);

// reports
commonRouter.post('/reports', authMiddleware, reportController.createReport);

// appointment
commonRouter.post("/appointments", authMiddleware, appointmentController.createAppointment);
commonRouter.get("/appointments/my", authMiddleware, appointmentController.getAppointmentByUserId);
commonRouter.patch("/appointments/:appointmentId/cancel", authMiddleware, appointmentController.cancelAppointment);

//room
commonRouter.get("/boarding-houses/:boardingHouseId/rooms", authMiddleware, roomController.getRoomsByBoardingHouse);
commonRouter.get("/rooms/:roomId", authMiddleware, roomController.getRoomDetails);
export { commonRouter };
