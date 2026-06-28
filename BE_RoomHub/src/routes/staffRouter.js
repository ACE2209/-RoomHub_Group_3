import { Router } from 'express';
import { boardingHouseController, appointmentController, depositController } from '../controllers/index.js';
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

export { staffRouter };
