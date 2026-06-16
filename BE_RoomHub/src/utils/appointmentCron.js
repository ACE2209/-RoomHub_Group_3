import cron from "node-cron";
import Appointment from "../models/appointment.js";

export const startAppointmentCron = () => {
  cron.schedule("0 * * * *", async () => {
    try {
      const result = await Appointment.updateExpiredAppointments();

      console.log(
        `Updated ${result.modifiedCount} expired appointments`
      );
    } catch (error) {
      console.error("Error updating expired appointments:", error);
    }
  });
};