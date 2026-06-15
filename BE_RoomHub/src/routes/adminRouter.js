import { Router } from 'express';

import {
  ReviewController,
  accountController,
  reportController,
  boardingHouseController,
} from '../controllers/index.js';

const adminRouter = Router();

// ── ACCOUNTS ──────────────────────────────────────
adminRouter.get('/accounts', accountController.getAllAccount);
adminRouter.get('/accounts/filter', accountController.filterAccounts);
adminRouter.post('/accounts/create', accountController.createAccount);
adminRouter.put('/accounts/:accountId', accountController.updateAccount);
adminRouter.delete('/accounts/:accountId', accountController.softDeleteAccount);

// ── REVIEWS ───────────────────────────────────────
adminRouter.get('/reviews', ReviewController.getReviews);
adminRouter.get('/reviews/filter', ReviewController.filterReviews);
adminRouter.get('/reviews/:reviewId', ReviewController.getReviewDetail);
adminRouter.delete('/reviews/:reviewId', ReviewController.softDeleteReview);

// ── REPORTS ───────────────────────────────────────
adminRouter.get('/reports', reportController.getReportsByAdmin);
adminRouter.get('/reports/:reportId', reportController.getReportDetail);
adminRouter.put('/reports/:reportId/send-email', reportController.sendReportReplyByEmail);
adminRouter.delete('/reports/:reportId', reportController.softDeleteReport);

// ── REVIEW REPORTS ────────────────────────────────
adminRouter.get('/review-reports', reportController.getReviewReports);
adminRouter.get('/review-reports/filter', reportController.filterReviewReports);
adminRouter.get('/reportReview/:reportId', reportController.getReportReviewDetail);

// ── BOARDING HOUSES ───────────────────────────────
adminRouter.get('/boardinghouses', boardingHouseController.getAllBoardingHouses);
adminRouter.get('/boardinghouses/filter', boardingHouseController.filterBoardingHouses);
adminRouter.delete('/boardinghouses/:id', boardingHouseController.deleteBoardingHouse);

export { adminRouter };