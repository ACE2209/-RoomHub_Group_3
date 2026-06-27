import { Router } from 'express';

import {
  ReviewController,
  BoardingHouseController,
  accountController,
  reportController,
  boardingHouseController,
} from '../controllers/index.js';
import reviewController from '../controllers/reviewController.js';
import { upload } from '../config/cloudinary.config.js';

const adminRouter = Router();

adminRouter.get('/accounts', accountController.getAllAccount);
adminRouter.get('/accounts/filter', accountController.filterAccounts);
adminRouter.post('/accounts/create', accountController.createAccount);
adminRouter.put('/accounts/:accountId', accountController.updateAccount);
adminRouter.delete('/accounts/:accountId', accountController.softDeleteAccount);

adminRouter.get('/reviews', ReviewController.getReviews);
adminRouter.get('/reviews/filter', ReviewController.filterReviews);
adminRouter.get('/reviews/:reviewId', ReviewController.getReviewDetail);
adminRouter.delete('/reviews/:reviewId', ReviewController.softDeleteReview);

adminRouter.get('/reports', reportController.getReportsByAdmin);
adminRouter.get('/reports/:reportId', reportController.getReportDetail);
adminRouter.put('/reports/:reportId/send-email', reportController.sendReportReplyByEmail);
adminRouter.delete('/reports/:reportId', reportController.softDeleteReport);

adminRouter.get('/review-reports', reportController.getReviewReports);
adminRouter.get('/review-reports/filter', reportController.filterReviewReports);
adminRouter.get('/reportReview/:reportId', reportController.getReportReviewDetail);
adminRouter.get('/boarding-house-reports', reportController.getBoardingHouseReports);
adminRouter.get('/boarding-house-reports/filter', reportController.filterBoardingHouseReports);

adminRouter.get('/boardinghouses', boardingHouseController.getAllBoardingHouses);
adminRouter.get('/boardinghouses/filter', boardingHouseController.filterBoardingHouses);
adminRouter.delete('/boardinghouses/:id', boardingHouseController.deleteBoardingHouse);

adminRouter.get('/boardinghouse', BoardingHouseController.getAllBHOnDashBoard);
adminRouter.get('/boardinghouse/chore/get-max', BoardingHouseController.getMaxPriceBH);
adminRouter.get('/boardinghouse/chore/filter', BoardingHouseController.filterBoardingHouse);
adminRouter.get('/boardinghouse/:id', BoardingHouseController.getBoardingHouseDetails);
adminRouter.put('/boardinghouse/:id', upload.array('boardingHouse'), BoardingHouseController.updateBoardingHouseDetails);
adminRouter.post('/boardinghouse/create', upload.array('boardingHouse'), BoardingHouseController.createBoardingHouse);
adminRouter.delete('/boardinghouse/:id/softDelete', BoardingHouseController.softDeleteBoardingHouse);
adminRouter.post('/boardinghouse/:id/images', BoardingHouseController.addBoardingHouseImage);
adminRouter.put('/boardinghouse/:id/images/:imageId', BoardingHouseController.updateBoardingHouseImage);
adminRouter.delete('/boardinghouse/:id/images/:imageId', BoardingHouseController.deleteBoardingHouseImage);
adminRouter.get('/boardinghouse/:id/images', BoardingHouseController.getBoardingHouseImages);
adminRouter.get('/types', BoardingHouseController.getAllBoardingHouseTypes);

export { adminRouter };
