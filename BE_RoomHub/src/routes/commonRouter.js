import { Router } from 'express';
import { authController, boardingHouseController } from '../controllers/index.js';

const commonRouter = Router();

//auth
commonRouter.post('/login', authController.login);
commonRouter.post('/forgot-password', authController.forgotPassword);
commonRouter.post('/reset-password', authController.resetPassword);
commonRouter.post('/send-otp-register', authController.sendOTPRegister);
commonRouter.post('/verify-register', authController.verifyRegister);

// Boarding House
commonRouter.get('/boardinghouse', boardingHouseController.getAllBoardingHouses);
commonRouter.get('/boardinghouse/:id', boardingHouseController.getBoardingHouseDetails);
export { commonRouter };
