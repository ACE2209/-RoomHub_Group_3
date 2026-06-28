import { Router } from 'express';
import { boardingHouseController, appointmentController, depositController } from '../controllers/index.js';
import { upload } from '../config/cloudinary.config.js';

const ownerRouter = Router();

ownerRouter.get("/appointments", appointmentController.getManagedAppointments);
ownerRouter.get("/appointments/:appointmentId",appointmentController.getManagedAppointmentDetail);
ownerRouter.patch("/appointments/:appointmentId/status",appointmentController.updateManagedAppointmentStatus);

ownerRouter.get("/deposits", depositController.getDepositsByOwnerOrStaff);
ownerRouter.patch("/deposits/:depositId/decision", depositController.handleDepositDecision);
ownerRouter.delete("/deposits/:depositId", depositController.deleteDepositRoom);

export { ownerRouter };
