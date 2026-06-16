import mongoose from "mongoose";
import Appointment from "../models/appointment.js";
import Room from "../models/room.js";

class appointmentController {
  // VIEW LIST OF APPOINTMENT
  async getAppointmentByUserId(req, res) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      await Appointment.updateExpiredAppointments();

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const filter = {
        accountId: userId,
      };

      const totalItems = await Appointment.countDocuments(filter);

      const appointmentList = await Appointment.find(filter)
        .populate({
          path: "roomId",
          populate: {
            path: "boardingHouseId",
            populate: {
              path: "ownerId",
              select: "fullname email",
            },
          },
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const data = appointmentList.map((appointment) => ({
        _id: appointment._id,
        ownerName:
          appointment.roomId?.boardingHouseId?.ownerId?.fullname || null,
        boardingHouseName:
          appointment.roomId?.boardingHouseId?.name || null,
        roomNumber: appointment.roomId?.roomNumber || null,
        appointmentDate: appointment.appointmentDate,
        status: appointment.status,
        note: appointment.note || "",
        roomId: appointment.roomId?._id || null,
        reasonForCancel: appointment.reasonForCancel || null,
      }));

      const totalPages = Math.ceil(totalItems / limit);

      return res.status(200).json({
        success: true,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        data,
      });
    } catch (error) {
      console.error("Error in getAppointmentByUserId:", error);

      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }

  // MAKE APPOINTMENT
  async createAppointment(req, res) {
    try {
      const userId = req.user?.userId;
      const { roomId, appointmentDate, note } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (!roomId || !appointmentDate) {
        return res.status(400).json({
          success: false,
          message: "roomId and appointmentDate are required",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(roomId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid roomId",
        });
      }

      const room = await Room.findById(roomId);

      if (!room) {
        return res.status(404).json({
          success: false,
          message: "Room not found",
        });
      }

      if (!room.isAvailable) {
  return res.status(400).json({
    success: false,
    message: "This room is not available",
  });
}

      const appointmentTime = new Date(appointmentDate);
const oneHourLater = new Date();
oneHourLater.setHours(oneHourLater.getHours() + 1);

      if (isNaN(appointmentTime.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid appointment date",
        });
      }
    
      if (appointmentTime < oneHourLater) {
  return res.status(400).json({
    success: false,
    message: "Appointment must be scheduled at least 1 hour in advance",
  });
}

      if (appointmentTime <= new Date()) {
        return res.status(400).json({
          success: false,
          message: "Appointment date must be in the future",
        });
      }

      const existingAppointment = await Appointment.findOne({
        accountId: userId,
        roomId,
        status: {
          $in: ["pending", "accepted"],
        },
      });

      if (existingAppointment) {
        return res.status(400).json({
          success: false,
          message:
            "You already have a pending or accepted appointment for this room",
        });
      }

      const appointment = await Appointment.create({
        accountId: userId,
        roomId,
        appointmentDate: appointmentTime,
        note: note || "",
        status: "pending",
      });

      return res.status(201).json({
        success: true,
        message: "Appointment created successfully",
        data: appointment,
      });
    } catch (error) {
      console.error("Create appointment failed:", error);

      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }

  // CANCEL APPOINTMENT
  async cancelAppointment(req, res) {
    try {
      const userId = req.user?.userId;
      const { appointmentId } = req.params;
      const { reasonForCancel } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid appointmentId",
        });
      }

      const appointment = await Appointment.findById(appointmentId);

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
      }

      if (appointment.accountId.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "You can only cancel your own appointment",
        });
      }

      if (appointment.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: "Only pending appointments can be canceled",
        });
      }

      if (new Date(appointment.appointmentDate) <= new Date()) {
        appointment.status = "canceled";
        appointment.reasonForCancel = "Appointment expired";
        await appointment.save();

        return res.status(400).json({
          success: false,
          message:
            "This appointment has expired and was canceled automatically",
          data: appointment,
        });
      }

      appointment.status = "canceled";
      appointment.reasonForCancel =
        reasonForCancel || "Canceled by user";

      await appointment.save();

      return res.status(200).json({
        success: true,
        message: "Appointment canceled successfully",
        data: appointment,
      });
    } catch (error) {
      console.error("Cancel appointment failed:", error);

      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }
}

export default new appointmentController();