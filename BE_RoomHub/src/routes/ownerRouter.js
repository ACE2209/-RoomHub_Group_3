import { Router } from 'express';
import {
  boardingHouseController,
  appointmentController,
  depositController,
  roomAdditionFeeController,
  ReviewController,
  monthlyRentController,
  roomTypeController,
  refundRequestController,
  staffManagementController,
  taskController,
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

ownerRouter.get("/deposits", depositController.getDepositsByOwnerOrStaff);
ownerRouter.patch("/deposits/:depositId/decision", depositController.handleDepositDecision);
ownerRouter.delete("/deposits/:depositId", depositController.deleteDepositRoom);

ownerRouter.post("/room-addition-fee", roomAdditionFeeController.createRoomAdditionFee);
ownerRouter.get("/room-addition-fee", roomAdditionFeeController.getAllRoomAdditionFees);
ownerRouter.get("/room-addition-fee/calculate-rent/:roomId", roomAdditionFeeController.getRoomAdditionFeeForMonthlyCalculate);
ownerRouter.put("/room-addition-fee/:id", roomAdditionFeeController.updateRoomAdditionFee);
ownerRouter.delete("/room-addition-fee/:id", roomAdditionFeeController.deleteRoomAdditionFee);
ownerRouter.get("/room-addition-fee/:roomId", roomAdditionFeeController.getRoomAdditionFeesByRoomId);

ownerRouter.get("/monthly-rent-payments", monthlyRentController.getManagedRentPayments);
ownerRouter.get("/monthly-rents", monthlyRentController.getManagedMonthlyRents);
ownerRouter.post("/monthly-rents/calculate/:roomId", monthlyRentController.calculateMonthlyRent);
ownerRouter.patch("/monthly-rents/:billId/status", monthlyRentController.updateManagedMonthlyRentStatus);
ownerRouter.get("/monthly-rents/:billId", monthlyRentController.getManagedMonthlyRentDetail);

//roomtype
ownerRouter.get("/boardinghouse/room-types/:id", roomTypeController.getRoomTypeByBhId);
ownerRouter.post("/boardinghouse/roomtype/:id/create", upload.single("roomType"), roomTypeController.addRoomTypeToBoardingHouse);
ownerRouter.put("/boardinghouse/roomtype/:roomTypeId/", upload.single("roomType"), roomTypeController.updateRoomTypeToBoardingHouse);
ownerRouter.delete("/boardinghouse/roomtype/:roomTypeId/", roomTypeController.softDeleteRoomType);

ownerRouter.get("/staffs", staffManagementController.getOwnerStaffs.bind(staffManagementController));
ownerRouter.post("/staffs", staffManagementController.createOwnerStaff.bind(staffManagementController));
ownerRouter.post("/staffs/:staffId/invitation", staffManagementController.resendOwnerStaffInvitation.bind(staffManagementController));
ownerRouter.put("/staffs/:staffId", staffManagementController.updateOwnerStaff.bind(staffManagementController));
ownerRouter.delete("/staffs/:staffId", staffManagementController.deleteOwnerStaff.bind(staffManagementController));

ownerRouter.get("/tasks", taskController.getManagedTasks.bind(taskController));
ownerRouter.post("/tasks", taskController.createManagedTask.bind(taskController));
ownerRouter.get("/tasks/:taskId", taskController.getManagedTaskDetail.bind(taskController));
ownerRouter.put("/tasks/:taskId", taskController.updateManagedTask.bind(taskController));
ownerRouter.delete("/tasks/:taskId", taskController.deleteManagedTask.bind(taskController));
// REFUND MANAGEMENT
ownerRouter.get(
  "/refund-requests",
  refundRequestController.getManagedRefundRequests
);

ownerRouter.patch(
  "/refund-requests/:refundRequestId/reject",
  refundRequestController.rejectRefundRequest
);

ownerRouter.post(
  "/refund-requests/:refundRequestId/pay",
  refundRequestController.createRefundPayment
);
export { ownerRouter };
