import { Router } from 'express';

import {
  ReviewController,
  BoardingHouseController,
} from '../controllers/index.js';
import reviewController from '../controllers/reviewController.js';
import { upload } from '../config/cloudinary.config.js';

const adminRouter = Router();

//review
adminRouter.get('/reviews', ReviewController.getReviews);
adminRouter.get('/reviews/:reviewId', ReviewController.getReviewDetail);

//boarding house
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
