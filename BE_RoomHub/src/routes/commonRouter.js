import { Router } from 'express';
import {
  authController,
} from '../controllers/index.js';
import reportController from '../controllers/reportController.js';
import { authMiddleware } from '../middlewares/index.js';

const commonRouter = Router();

//auth

commonRouter.post('/login', authController.login);

commonRouter.post('/login', authController.login);
commonRouter.post('/login-with-google', authController.loginWithGoogle);
commonRouter.post('/register-with-google', authController.registerWithGoogle);
commonRouter.post('/forgot-password', authController.forgotPassword);
commonRouter.post('/reset-password', authController.resetPassword);
commonRouter.post('/send-otp-register', authController.sendOTPRegister);
commonRouter.post('/verify-register', authController.verifyRegister);

// reports
commonRouter.post('/reports', authMiddleware, reportController.createReport);

export { commonRouter };
