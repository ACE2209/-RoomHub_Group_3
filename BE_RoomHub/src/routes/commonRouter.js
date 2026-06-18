import { Router } from 'express';
import {
  authController,
   boardingHouseController,
   roomTypeController
} from '../controllers/index.js';

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


// Boarding House

commonRouter.get(
  '/boardinghouse',
  boardingHouseController.getAllBoardingHousesForGuest
);

commonRouter.get(
  '/boardinghouse/highrating',
  boardingHouseController.getHighRatingBH
);

commonRouter.get(
  '/boardinghouse/newest',
  boardingHouseController.getNewestBH
);

// view room type for guest/user
commonRouter.get(
  '/boardinghouse/room-types/:id',
  roomTypeController.getRoomTypeByBhId
);

commonRouter.get(
  '/boardinghouse/:id',
  boardingHouseController.getBoardingHouseDetailInUser
);
export { commonRouter };
