import { Router } from 'express';
import {
  authController,
  boardingHouseController,
  ReviewController,
} from '../controllers/index.js';
import reportController from '../controllers/reportController.js';
import { authMiddleware } from '../middlewares/index.js';

const commonRouter = Router();

//auth
commonRouter.post('/login', authController.login);
commonRouter.post('/forgot-password', authController.forgotPassword);
commonRouter.post('/reset-password', authController.resetPassword);
commonRouter.post('/send-otp-register', authController.sendOTPRegister);
commonRouter.post('/verify-register', authController.verifyRegister);

// reports
commonRouter.post('/reports', authMiddleware, reportController.createReport);

// boarding houses
commonRouter.get('/boardinghouse/:id', boardingHouseController.getBoardingHouseDetails);
commonRouter.get('/boardinghouse/:boardingHouseId/reviews', ReviewController.getReviewsByBoardingHouse);

export { commonRouter };
