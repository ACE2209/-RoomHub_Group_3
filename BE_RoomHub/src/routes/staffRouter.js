import { Router } from 'express';
import { boardingHouseController } from '../controllers/index.js';
import { upload } from '../config/cloudinary.config.js';

const staffRouter = Router();

staffRouter.get('/types', boardingHouseController.getBoardingHouseTypes);
staffRouter.get('/boardinghouses', boardingHouseController.getOwnBoardingHouses.bind(boardingHouseController));
staffRouter.get('/boardinghouses/:id', boardingHouseController.getOwnBoardingHouseDetails.bind(boardingHouseController));
staffRouter.post(
  '/boardinghouses',
  upload.array('boardingHouse', 16),
  boardingHouseController.createOwnBoardingHouse.bind(boardingHouseController)
);
staffRouter.put(
  '/boardinghouses/:id',
  upload.array('boardingHouse', 16),
  boardingHouseController.updateOwnBoardingHouse.bind(boardingHouseController)
);
staffRouter.delete('/boardinghouses/:id', boardingHouseController.deleteOwnBoardingHouse.bind(boardingHouseController));

export { staffRouter };
