import { Router } from 'express';

import {
  ReviewController,
} from '../controllers/index.js';
import reviewController from '../controllers/reviewController.js';

const adminRouter = Router();

//review
adminRouter.get('/reviews', ReviewController.getReviews);
adminRouter.get('/reviews/:reviewId', ReviewController.getReviewDetail);

export { adminRouter };
