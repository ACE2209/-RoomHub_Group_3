import { Router } from 'express';
import {
  authController,
  boardingHouseController,
  roomController,
  roomAdditionFeeController,
  appointmentController,
  depositController,
  ReviewController,
  monthlyRentController,
} from "../controllers/index.js";
import { upload } from '../config/cloudinary.config.js';

const staffRouter = Router();

staffRouter.get("/reviews", ReviewController.getManagedReviews.bind(ReviewController));
staffRouter.get("/boardinghouse/reviews/:id", ReviewController.getManagedReviewByBhId.bind(ReviewController));
staffRouter.post("/reviews/reply", ReviewController.replyReview.bind(ReviewController));
staffRouter.put("/reviews/reply/:replyId", ReviewController.updateReplyReview.bind(ReviewController));
staffRouter.delete("/reviews/reply/:replyId", ReviewController.softDeleteReplyReview.bind(ReviewController));

staffRouter.get('/types', boardingHouseController.getBoardingHouseTypes);
staffRouter.get('/boardinghouses', boardingHouseController.getOwnBoardingHouses.bind(boardingHouseController));
staffRouter.get('/boardinghouses/:id', boardingHouseController.getOwnBoardingHouseDetails.bind(boardingHouseController));
staffRouter.post('/boardinghouses', upload.array('boardingHouse', 16), boardingHouseController.createOwnBoardingHouse.bind(boardingHouseController));
staffRouter.put('/boardinghouses/:id', upload.array('boardingHouse', 16), boardingHouseController.updateOwnBoardingHouse.bind(boardingHouseController));
staffRouter.delete('/boardinghouses/:id', boardingHouseController.deleteOwnBoardingHouse.bind(boardingHouseController));

// APPOINTMENT MANAGEMENT//
staffRouter.get("/appointments", appointmentController.getManagedAppointments);
staffRouter.get("/appointments/:appointmentId", appointmentController.getManagedAppointmentDetail);
staffRouter.patch("/appointments/:appointmentId/status", appointmentController.updateManagedAppointmentStatus);

// DEPOSIT MANAGEMENT
staffRouter.get("/deposits", depositController.getDepositsByOwnerOrStaff);
staffRouter.patch("/deposits/:depositId/decision", depositController.handleDepositDecision);
staffRouter.delete("/deposits/:depositId", depositController.deleteDepositRoom);
staffRouter.delete(
  "/deposit-room/:depositRoomId",
  depositController.deleteDepositRoom
);

// room Addition Fee
staffRouter.post("/room-addition-fee", roomAdditionFeeController.createRoomAdditionFee);
staffRouter.get("/room-addition-fee", roomAdditionFeeController.getAllRoomAdditionFees);
staffRouter.get("/room-addition-fee/calculate-rent/:roomId", roomAdditionFeeController.getRoomAdditionFeeForMonthlyCalculate);
staffRouter.put("/room-addition-fee/:id", roomAdditionFeeController.updateRoomAdditionFee);
staffRouter.delete("/room-addition-fee/:id", roomAdditionFeeController.deleteRoomAdditionFee);
staffRouter.get("/room-addition-fee/:roomId", roomAdditionFeeController.getRoomAdditionFeesByRoomId);

staffRouter.get("/monthly-rent-payments", monthlyRentController.getManagedRentPayments);
staffRouter.get("/monthly-rents", monthlyRentController.getManagedMonthlyRents);
staffRouter.post("/monthly-rents/calculate/:roomId", monthlyRentController.calculateMonthlyRent);
staffRouter.patch("/monthly-rents/:billId/status", monthlyRentController.updateManagedMonthlyRentStatus);
staffRouter.get("/monthly-rents/:billId", monthlyRentController.getManagedMonthlyRentDetail);

// room
staffRouter.get("/room", roomController.getAllRooms);
staffRouter.get("/room/boarding-house/:boardingHouseId", roomController.getRoomsByBoardingHouse);
staffRouter.post("/room/boarding-house", upload.single("Room"), roomController.addRoom);
staffRouter.put("/room/boarding-house/:roomId", upload.single("Room"), roomController.updateRoom);
staffRouter.delete("/room/boarding-house/:roomId", roomController.deleteRoom);

export { staffRouter };
