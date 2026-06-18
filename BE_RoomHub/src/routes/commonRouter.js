import { Router } from "express";
import {
  authController,
  boardingHouseController,
  roomTypeController,
} from "../controllers/index.js";

const commonRouter = Router();

/* =========================
   AUTH
========================= */

commonRouter.post("/login", authController.login);
commonRouter.post("/forgot-password", authController.forgotPassword);
commonRouter.post("/reset-password", authController.resetPassword);
commonRouter.post("/send-otp-register", authController.sendOTPRegister);
commonRouter.post("/verify-register", authController.verifyRegister);

/* =========================
   BOARDING HOUSE
========================= */

// View all boarding houses
commonRouter.get(
  "/boardinghouse",
  boardingHouseController.getAllBoardingHousesForGuest
);

// View high rating boarding houses
commonRouter.get(
  "/boardinghouse/highrating",
  boardingHouseController.getHighRatingBH
);

// View newest boarding houses
commonRouter.get(
  "/boardinghouse/newest",
  boardingHouseController.getNewestBH
);

// View room types by boarding house
commonRouter.get(
  "/boardinghouse/room-types/:id",
  roomTypeController.getRoomTypeByBhId
);

// View boarding house detail
commonRouter.get(
  "/boardinghouse/:id",
  boardingHouseController.getBoardingHouseDetailInUser
);

export { commonRouter };