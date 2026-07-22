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
  roomTypeController,
  refundRequestController,
  revenueController,
  taskController,
  renewalController,
  bhExpenseController,
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
staffRouter.delete("/deposit-room/:depositRoomId", depositController.deleteDepositRoom);

// room Addition Fee
staffRouter.post("/room-addition-fee", roomAdditionFeeController.createRoomAdditionFee);
staffRouter.get("/room-addition-fee", roomAdditionFeeController.getAllRoomAdditionFees);
staffRouter.get("/room-addition-fee/calculate-rent/:roomId", roomAdditionFeeController.getRoomAdditionFeeForMonthlyCalculate);
staffRouter.put("/room-addition-fee/:id", roomAdditionFeeController.updateRoomAdditionFee);
staffRouter.delete("/room-addition-fee/:id", roomAdditionFeeController.deleteRoomAdditionFee);
staffRouter.get("/room-addition-fee/:roomId", roomAdditionFeeController.getRoomAdditionFeesByRoomId);

staffRouter.get("/monthly-rent-payments", monthlyRentController.getManagedRentPayments);
staffRouter.get("/monthly-rents", monthlyRentController.getManagedMonthlyRents);
staffRouter.get("/monthly-rents/next-cycle/:roomId", monthlyRentController.getNextRentCyclePreview);
staffRouter.post("/monthly-rents/calculate/:roomId", monthlyRentController.calculateMonthlyRent);
staffRouter.patch("/monthly-rents/:billId/status", monthlyRentController.updateManagedMonthlyRentStatus);
staffRouter.get("/monthly-rents/:billId", monthlyRentController.getManagedMonthlyRentDetail);

// RENEWAL REQUEST MANAGEMENT
staffRouter.get("/renewal-requests", renewalController.getManagedRenewalRequests);
staffRouter.patch("/renewal-requests/:requestId/decision", renewalController.handleRenewalRequestDecision);

// EXPENSE MANAGEMENT
staffRouter.get("/expenses", bhExpenseController.getExpensesByTime);
staffRouter.post("/expenses", bhExpenseController.addExpense);
staffRouter.put("/expenses/:expenseId", bhExpenseController.updateExpense);
staffRouter.delete("/expenses/:expenseId", bhExpenseController.deleteExpense);

// room
staffRouter.get("/room", roomController.getAllRooms);
staffRouter.get("/room/boarding-house/:boardingHouseId", roomController.getRoomsByBoardingHouse);
staffRouter.post("/room/boarding-house", upload.array("Room", 10), roomController.addRoom);
staffRouter.put("/room/boarding-house/:roomId", upload.array("Room", 10), roomController.updateRoom);
staffRouter.delete("/room/boarding-house/:roomId", roomController.deleteRoom);


//roomtype
staffRouter.get("/boardinghouse/room-types/:id", roomTypeController.getRoomTypeByBhId.bind(roomTypeController));
staffRouter.post("/boardinghouse/roomtype/:id/create", upload.single("roomType"), roomTypeController.addRoomTypeToBoardingHouse.bind(roomTypeController));
staffRouter.put("/boardinghouse/roomtype/:roomTypeId/", upload.single("roomType"), roomTypeController.updateRoomTypeToBoardingHouse.bind(roomTypeController));
staffRouter.delete("/boardinghouse/roomtype/:roomTypeId/", roomTypeController.softDeleteRoomType.bind(roomTypeController));

staffRouter.get("/tasks", taskController.getManagedTasks.bind(taskController));
staffRouter.post("/tasks", taskController.createManagedTask.bind(taskController));
staffRouter.get("/tasks/:taskId", taskController.getManagedTaskDetail.bind(taskController));
staffRouter.put("/tasks/:taskId", taskController.updateManagedTask.bind(taskController));
staffRouter.delete("/tasks/:taskId", taskController.deleteManagedTask.bind(taskController));

// REFUND MANAGEMENT
staffRouter.get(
  "/refund-requests",
  refundRequestController.getManagedRefundRequests
);

staffRouter.patch(
  "/refund-requests/:refundRequestId/reject",
  refundRequestController.rejectRefundRequest
);

staffRouter.post(
  "/refund-requests/:refundRequestId/pay",
  refundRequestController.createRefundPayment
);
export { staffRouter };
