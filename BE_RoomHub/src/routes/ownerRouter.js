import { Router } from 'express';
import {
  boardingHouseController,
  appointmentController,
  roomAdditionFeeController,
  depositController,
  ReviewController,
} from '../controllers/index.js';
import { upload } from '../config/cloudinary.config.js';

const ownerRouter = Router();

ownerRouter.get('/types', boardingHouseController.getBoardingHouseTypes);
ownerRouter.get('/boardinghouses', boardingHouseController.getOwnBoardingHouses.bind(boardingHouseController));
ownerRouter.get('/boardinghouses/:id', boardingHouseController.getOwnBoardingHouseDetails.bind(boardingHouseController));
ownerRouter.post('/boardinghouses', upload.array('boardingHouse', 16), boardingHouseController.createOwnBoardingHouse.bind(boardingHouseController));
ownerRouter.put('/boardinghouses/:id', upload.array('boardingHouse', 16), boardingHouseController.updateOwnBoardingHouse.bind(boardingHouseController));
ownerRouter.delete('/boardinghouses/:id', boardingHouseController.deleteOwnBoardingHouse.bind(boardingHouseController));

ownerRouter.get("/reviews", ReviewController.getManagedReviews.bind(ReviewController));
ownerRouter.get("/boardinghouse/reviews/:id", ReviewController.getManagedReviewByBhId.bind(ReviewController));
ownerRouter.post("/reviews/reply", ReviewController.replyReview.bind(ReviewController));
ownerRouter.put("/reviews/reply/:replyId", ReviewController.updateReplyReview.bind(ReviewController));
ownerRouter.delete("/reviews/reply/:replyId", ReviewController.softDeleteReplyReview.bind(ReviewController));

ownerRouter.get("/appointments", appointmentController.getManagedAppointments);
ownerRouter.get("/appointments/:appointmentId", appointmentController.getManagedAppointmentDetail);
ownerRouter.patch("/appointments/:appointmentId/status", appointmentController.updateManagedAppointmentStatus);

ownerRouter.post("/room-addition-fee", roomAdditionFeeController.createRoomAdditionFee);
ownerRouter.get("/room-addition-fee", roomAdditionFeeController.getAllRoomAdditionFees);
ownerRouter.get("/room-addition-fee/calculate-rent/:roomId", roomAdditionFeeController.getRoomAdditionFeeForMonthlyCalculate);
ownerRouter.put("/room-addition-fee/:id", roomAdditionFeeController.updateRoomAdditionFee);
ownerRouter.delete("/room-addition-fee/:id", roomAdditionFeeController.deleteRoomAdditionFee);
ownerRouter.get("/room-addition-fee/:roomId", roomAdditionFeeController.getRoomAdditionFeesByRoomId);

ownerRouter.get("/deposits", depositController.getDepositsByOwnerOrStaff);
ownerRouter.patch("/deposits/:depositId/decision", depositController.handleDepositDecision);
ownerRouter.delete("/deposits/:depositId", depositController.deleteDepositRoom);

export { ownerRouter };
