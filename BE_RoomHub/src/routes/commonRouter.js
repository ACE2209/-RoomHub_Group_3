import { Router } from 'express';
import {
  // appointmentController,
  authController,
  // boardingHouseController,
  // roomController,
  // depositController,
  // ReviewController,
  // roomTypeController,
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

// //boarding house
// commonRouter.get(
//   '/boardinghouse/filter',
//   boardingHouseController.filterBoardingHouse
// );
// commonRouter.get(
//   '/boardinghousetype',
//   boardingHouseController.getAllBoardingHouseTypes
// );
// commonRouter.get('/boardinghouse', boardingHouseController.getAllBHOnHome);
// commonRouter.get(
//   '/boardinghouse/highrating',
//   boardingHouseController.getHighRatingBH
// );
// commonRouter.get('/boardinghouse/newest', boardingHouseController.getNewestBH);
// commonRouter.get(
//   '/boardinghouse/search',
//   boardingHouseController.searchBoardingHouses
// );

// commonRouter.get(
//   '/boardinghouse/chore/get-max',
//   boardingHouseController.getMaxPriceBH
// );
// commonRouter.get(
//   '/boardinghouse/:id',
//   boardingHouseController.getBoardingHouseDetailInUser
// );

// commonRouter.get(
//   '/boardinghouse/room-types/:id',
//   roomTypeController.getRoomTypeByBhId
// );

// commonRouter.get(
//   '/boardinghouse/home/area',
//   boardingHouseController.getBhByArea
// );

// //review
// commonRouter.get(
//   '/boardinghouse/reviews/:id',
//   ReviewController.getReviewByBhId
// );

// commonRouter.get(
//   '/room/room-type/:roomTypeId',
//   roomController.getRoomsByRoomType
// );

// commonRouter.get(
//   '/appointment/owner/:ownerId',
//   appointmentController.getAppointmentsByOwnerId
// );

// // deposit
// commonRouter.get('/deposit/vnpay-return', depositController.vnpayReturn);
// commonRouter.get('/deposit/momo-return', depositController.momoReturn);

export { commonRouter };
