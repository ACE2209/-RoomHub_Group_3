import { Router } from 'express';

import {
  ReviewController,
  accountController,
  reportController,
} from '../controllers/index.js';

const adminRouter = Router();

// accounts
adminRouter.get('/accounts', accountController.getAllAccount);
adminRouter.get('/accounts/filter', accountController.filterAccounts);
adminRouter.post('/accounts/create', accountController.createAccount);
adminRouter.put('/accounts/:accountId', accountController.updateAccount);
adminRouter.delete('/accounts/:accountId', accountController.softDeleteAccount);

// reviews
adminRouter.get('/reviews', ReviewController.getReviews);
adminRouter.get('/reviews/filter', ReviewController.filterReviews);
adminRouter.get('/reviews/:reviewId', ReviewController.getReviewDetail);
adminRouter.delete('/reviews/:reviewId', ReviewController.softDeleteReview);

// reports
adminRouter.get('/reports', reportController.getReportsByAdmin);
adminRouter.get('/reports/:reportId', reportController.getReportDetail);
adminRouter.put('/reports/:reportId/send-email', reportController.sendReportReplyByEmail);
adminRouter.delete('/reports/:reportId', reportController.softDeleteReport);

// review reports
adminRouter.get('/review-reports', reportController.getReviewReports);
adminRouter.get('/reportReview/:reportId', reportController.getReportReviewDetail);

export { adminRouter };
