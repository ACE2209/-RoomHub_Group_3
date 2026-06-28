import { Router } from 'express';
import { boardingHouseController, appointmentController, depositController, roomAdditionFeeController } from '../controllers/index.js';
import { upload } from '../config/cloudinary.config.js';

const ownerRouter = Router();

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

export { ownerRouter };
