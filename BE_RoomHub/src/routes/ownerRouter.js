import { Router } from 'express';
import { boardingHouseController, appointmentController } from '../controllers/index.js';
import { upload } from '../config/cloudinary.config.js';

const ownerRouter = Router();

ownerRouter.get("/appointments", appointmentController.getManagedAppointments);
ownerRouter.get("/appointments/:appointmentId",appointmentController.getManagedAppointmentDetail);
ownerRouter.patch("/appointments/:appointmentId/status",appointmentController.updateManagedAppointmentStatus);

export { ownerRouter };