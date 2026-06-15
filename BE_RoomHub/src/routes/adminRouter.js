import { Router } from 'express';

import {
  ReviewController,
  reportController,
  boardingHouseController,
} from '../controllers/index.js';

const adminRouter = Router();

/* ==================================================
                    REVIEW MANAGEMENT
================================================== */

// Get all reviews
adminRouter.get(
  '/reviews',
  ReviewController.getReviews
);

// Filter reviews
adminRouter.get(
  '/reviews/filter',
  ReviewController.filterReviews
);

// Get review detail
adminRouter.get(
  '/reviews/:reviewId',
  ReviewController.getReviewDetail
);

// Soft delete review
adminRouter.delete(
  '/reviews/:reviewId',
  ReviewController.softDeleteReview
);

/* ==================================================
                REVIEW REPORT MANAGEMENT
================================================== */

// Get all review reports
adminRouter.get(
  '/review-reports',
  reportController.getReviewReports
);

// Get review report detail
adminRouter.get(
  '/reportReview/:reportId',
  reportController.getReportReviewDetail
);

// Delete (soft delete) review report
adminRouter.delete(
  '/reports/:reportId',
  reportController.softDeleteReport
);

/* ==================================================
              BOARDING HOUSE MANAGEMENT
================================================== */

// Get all boarding houses
adminRouter.get(
  '/boardinghouses',
  boardingHouseController.getAllBoardingHouses
);

// Filter boarding houses
adminRouter.get(
  '/boardinghouses/filter',
  boardingHouseController.filterBoardingHouses
);

// Soft delete boarding house
adminRouter.delete(
  '/boardinghouses/:id',
  boardingHouseController.deleteBoardingHouse
);

//Filter multiple report reviews
adminRouter.get('/review-reports/filter',reportController.filterReviewReports);
export { adminRouter };