import { Router } from 'express';

import {
  ReviewController,
  accountController,
} from '../controllers/index.js';
import reportController from '../controllers/reportController.js';
import reviewController from '../controllers/reviewController.js';

const adminRouter = Router();

// accounts
adminRouter.get('/accounts', accountController.getAllAccount);
adminRouter.get('/accounts/filter', accountController.filterAccounts);
adminRouter.post('/accounts/create', accountController.createAccount);
adminRouter.put('/accounts/:accountId', accountController.updateAccount);
adminRouter.delete('/accounts/:accountId', accountController.softDeleteAccount);

//review
adminRouter.get('/reviews', ReviewController.getReviews);
adminRouter.get('/reviews/:reviewId', ReviewController.getReviewDetail);

// reports
adminRouter.get('/reports', reportController.getReportsByAdmin);
adminRouter.get('/reports/:reportId', reportController.getReportDetail);
adminRouter.put('/reports/:reportId/send-email', reportController.sendReportReplyByEmail);
adminRouter.delete('/reports/:reportId', reportController.softDeleteReport);

export { adminRouter };
