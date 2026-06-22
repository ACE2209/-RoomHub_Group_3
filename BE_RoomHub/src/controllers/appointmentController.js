import mongoose from "mongoose";
import Appointment from "../models/appointment.js";
import Room from "../models/room.js";

class appointmentController {
  // VIEW LIST OF APPOINTMENT BY USER
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

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
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
          select: "name ownerId address",
          populate: {
            path: "ownerId",
            select: "fullname email phoneNumber",
          },
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const data = appointmentList.map((appointment) => {
      const room = appointment.roomId;
      const boardingHouse = room?.boardingHouseId;
      const owner = boardingHouse?.ownerId;

      return {
        _id: appointment._id,
        ownerName: owner?.fullname || null,
        ownerEmail: owner?.email || null,
        boardingHouseName: boardingHouse?.name || null,
        boardingHouseAddress: boardingHouse?.address || null,

        roomNumber:
          room?.roomNumber ||
          room?.number ||
          room?.name ||
          null,

        appointmentDate: appointment.appointmentDate,
        status: appointment.status,
        note: appointment.note || "",
        roomId: room?._id || null,
        reasonForCancel: appointment.reasonForCancel || "",
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt,
      };
    });

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
      message: error.message || "Server error",
    });
  }
}

  // MAKE APPOINTMENT
  async createAppointment(req, res) {
    try {
      const userId = req.user?.userId;
const role = req.user?.role;
const { roomId, appointmentDate, note } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "You must login to set appointment",
        });
      }
      if (role && role !== "user") {
  return res.status(403).json({
    success: false,
    message: "Only users can create appointments",
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

      if (isNaN(appointmentTime.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid appointment date",
        });
      }

      const oneHourLater = new Date();
      oneHourLater.setHours(oneHourLater.getHours() + 1);

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

      if (note && note.trim().length > 500) {
        return res.status(400).json({
          success: false,
          message: "Note cannot exceed 500 characters",
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
        note: note?.trim() || "",
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

  // CANCEL APPOINTMENT BY USER
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

      if (reasonForCancel && reasonForCancel.trim().length > 500) {
        return res.status(400).json({
          success: false,
          message: "Cancel reason cannot exceed 500 characters",
        });
      }

      await Appointment.updateExpiredAppointments();

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
        reasonForCancel?.trim() || "Canceled by user";

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

  // VIEW LIST OF APPOINTMENTS FOR STAFF / OWNER
  async getManagedAppointments(req, res) {
    try {
      const userId = req.user?.userId;
      const role = req.user?.role;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (!["owner", "staff"].includes(role)) {
        return res.status(403).json({
          success: false,
          message: "Only owner or staff can manage appointments",
        });
      }

      await Appointment.updateExpiredAppointments();

      const page = Math.max(parseInt(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 50);
      const skip = (page - 1) * limit;

      const { status, keyword, fromDate, toDate } = req.query;

      const appointmentFilter = {};

      if (status) {
        const validStatuses = [
          "pending",
          "accepted",
          "rejected",
          "canceled",
          "completed",
        ];

        if (!validStatuses.includes(status)) {
          return res.status(400).json({
            success: false,
            message: "Invalid appointment status",
          });
        }

        appointmentFilter.status = status;
      }

      if (fromDate || toDate) {
        appointmentFilter.appointmentDate = {};

        if (fromDate) {
          const from = new Date(fromDate);

          if (isNaN(from.getTime())) {
            return res.status(400).json({
              success: false,
              message: "Invalid fromDate",
            });
          }

          appointmentFilter.appointmentDate.$gte = from;
        }

        if (toDate) {
          const to = new Date(toDate);

          if (isNaN(to.getTime())) {
            return res.status(400).json({
              success: false,
              message: "Invalid toDate",
            });
          }

          appointmentFilter.appointmentDate.$lte = to;
        }

        if (
          appointmentFilter.appointmentDate.$gte &&
          appointmentFilter.appointmentDate.$lte &&
          appointmentFilter.appointmentDate.$gte >
            appointmentFilter.appointmentDate.$lte
        ) {
          return res.status(400).json({
            success: false,
            message: "fromDate cannot be greater than toDate",
          });
        }
      }

      const appointments = await Appointment.find(appointmentFilter)
        .populate({
          path: "accountId",
          select: "fullname email phoneNumber",
        })
        .populate({
          path: "roomId",
          populate: {
            path: "boardingHouseId",
            select: "name ownerId staffId address",
            populate: [
              {
                path: "ownerId",
                select: "fullname email phoneNumber",
              },
              {
                path: "staffId",
                select: "fullname email phoneNumber",
              },
            ],
          },
        })
        .sort({ appointmentDate: 1, createdAt: -1 })
        .lean();

      let managedAppointments = appointments.filter((appointment) => {
        const boardingHouse = appointment.roomId?.boardingHouseId;

        if (!boardingHouse) return false;

        const ownerId = boardingHouse.ownerId?._id?.toString();
        const staffId = boardingHouse.staffId?._id?.toString();

        if (role === "owner") {
          return ownerId === userId;
        }

        if (role === "staff") {
          return staffId === userId;
        }

        return false;
      });

      if (keyword && keyword.trim()) {
        const search = keyword.trim().toLowerCase();

        managedAppointments = managedAppointments.filter((appointment) => {
          const userName = appointment.accountId?.fullname || "";
          const userEmail = appointment.accountId?.email || "";
          const userPhone = appointment.accountId?.phoneNumber || "";
          const roomNumber = appointment.roomId?.roomNumber || "";
          const boardingHouseName =
            appointment.roomId?.boardingHouseId?.name || "";

          return (
            userName.toLowerCase().includes(search) ||
            userEmail.toLowerCase().includes(search) ||
            userPhone.toLowerCase().includes(search) ||
            roomNumber.toLowerCase().includes(search) ||
            boardingHouseName.toLowerCase().includes(search)
          );
        });
      }

      const totalItems = managedAppointments.length;
      const totalPages = Math.ceil(totalItems / limit);

      const data = managedAppointments
        .slice(skip, skip + limit)
        .map((appointment) => ({
          _id: appointment._id,
          user: {
            _id: appointment.accountId?._id || null,
            fullname: appointment.accountId?.fullname || null,
            email: appointment.accountId?.email || null,
            phoneNumber: appointment.accountId?.phoneNumber || null,
          },
          boardingHouse: {
            _id: appointment.roomId?.boardingHouseId?._id || null,
            name: appointment.roomId?.boardingHouseId?.name || null,
            address: appointment.roomId?.boardingHouseId?.address || null,
          },
          room: {
            _id: appointment.roomId?._id || null,
            roomNumber: appointment.roomId?.roomNumber || null,
            isAvailable: appointment.roomId?.isAvailable ?? null,
          },
          appointmentDate: appointment.appointmentDate,
          status: appointment.status,
          note: appointment.note || "",
          reasonForCancel: appointment.reasonForCancel || "",
          createdAt: appointment.createdAt,
        }));

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
      console.error("Get managed appointments failed:", error);

      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }

  // VIEW APPOINTMENT DETAIL FOR STAFF / OWNER
  async getManagedAppointmentDetail(req, res) {
    try {
      const userId = req.user?.userId;
      const role = req.user?.role;
      const { appointmentId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (!["owner", "staff"].includes(role)) {
        return res.status(403).json({
          success: false,
          message: "Only owner or staff can view this appointment",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid appointmentId",
        });
      }

      await Appointment.updateExpiredAppointments();

      const appointment = await Appointment.findById(appointmentId)
        .populate({
          path: "accountId",
          select: "fullname email phoneNumber gender",
        })
        .populate({
          path: "roomId",
          populate: [
            {
              path: "boardingHouseId",
              select: "name ownerId staffId address images",
              populate: [
                {
                  path: "ownerId",
                  select: "fullname email phoneNumber",
                },
                {
                  path: "staffId",
                  select: "fullname email phoneNumber",
                },
              ],
            },
            {
              path: "roomTypeId",
              select: "typeName price acreage peopleNumber",
            },
          ],
        })
        .lean();

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
      }

      if (!appointment.roomId) {
        return res.status(404).json({
          success: false,
          message: "Room information not found",
        });
      }

      const boardingHouse = appointment.roomId?.boardingHouseId;

      if (!boardingHouse) {
        return res.status(404).json({
          success: false,
          message: "Boarding house information not found",
        });
      }

      const ownerId = boardingHouse.ownerId?._id?.toString();
      const staffId = boardingHouse.staffId?._id?.toString();

      const canAccess =
        (role === "owner" && ownerId === userId) ||
        (role === "staff" && staffId === userId);

      if (!canAccess) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to view this appointment",
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          _id: appointment._id,
          user: {
            _id: appointment.accountId?._id || null,
            fullname: appointment.accountId?.fullname || null,
            email: appointment.accountId?.email || null,
            phoneNumber: appointment.accountId?.phoneNumber || null,
            gender: appointment.accountId?.gender || null,
          },
          boardingHouse: {
            _id: boardingHouse._id,
            name: boardingHouse.name,
            address: boardingHouse.address,
            images: boardingHouse.images || [],
            owner: boardingHouse.ownerId || null,
            staff: boardingHouse.staffId || null,
          },
          room: {
            _id: appointment.roomId?._id || null,
            roomNumber: appointment.roomId?.roomNumber || null,
            isAvailable: appointment.roomId?.isAvailable ?? null,
            description: appointment.roomId?.description || "",
            images: appointment.roomId?.images || null,
            roomType: appointment.roomId?.roomTypeId || null,
          },
          appointmentDate: appointment.appointmentDate,
          status: appointment.status,
          note: appointment.note || "",
          reasonForCancel: appointment.reasonForCancel || "",
          createdAt: appointment.createdAt,
          updatedAt: appointment.updatedAt,
        },
      });
    } catch (error) {
      console.error("Get managed appointment detail failed:", error);

      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }

  // ACCEPT / REJECT APPOINTMENT FOR STAFF / OWNER
  async updateManagedAppointmentStatus(req, res) {
    try {
      const userId = req.user?.userId;
      const role = req.user?.role;
      const { appointmentId } = req.params;
      const { status, reasonForCancel } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (!["owner", "staff"].includes(role)) {
        return res.status(403).json({
          success: false,
          message: "Only owner or staff can update this appointment",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid appointmentId",
        });
      }

      if (!status) {
        return res.status(400).json({
          success: false,
          message: "Status is required",
        });
      }

      if (!["accepted", "rejected"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be accepted or rejected",
        });
      }

      if (status === "rejected" && !reasonForCancel?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Reject reason is required",
        });
      }

      if (reasonForCancel && reasonForCancel.trim().length > 500) {
        return res.status(400).json({
          success: false,
          message: "Reject reason cannot exceed 500 characters",
        });
      }

      await Appointment.updateExpiredAppointments();

      const appointment = await Appointment.findById(appointmentId).populate({
        path: "roomId",
        populate: {
          path: "boardingHouseId",
          select: "ownerId staffId name",
          populate: [
            {
              path: "ownerId",
              select: "fullname email",
            },
            {
              path: "staffId",
              select: "fullname email",
            },
          ],
        },
      });

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found",
        });
      }

      if (!appointment.roomId) {
        return res.status(404).json({
          success: false,
          message: "Room information not found",
        });
      }

      const boardingHouse = appointment.roomId?.boardingHouseId;

      if (!boardingHouse) {
        return res.status(404).json({
          success: false,
          message: "Boarding house information not found",
        });
      }

      const ownerId = boardingHouse.ownerId?._id?.toString();
      const staffId = boardingHouse.staffId?._id?.toString();

      const canManage =
        (role === "owner" && ownerId === userId) ||
        (role === "staff" && staffId === userId);

      if (!canManage) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to update this appointment",
        });
      }

      if (appointment.status !== "pending") {
        return res.status(400).json({
          success: false,
          message: "Only pending appointments can be accepted or rejected",
        });
      }

      if (new Date(appointment.appointmentDate) <= new Date()) {
        appointment.status = "canceled";
        appointment.reasonForCancel = "Appointment expired";
        await appointment.save();

        return res.status(400).json({
          success: false,
          message: "This appointment has expired and was canceled automatically",
          data: appointment,
        });
      }

      if (status === "accepted" && appointment.roomId.isAvailable === false) {
        return res.status(400).json({
          success: false,
          message: "Cannot accept appointment because this room is not available",
        });
      }

      if (status === "accepted") {
        const appointmentTime = new Date(appointment.appointmentDate);

        const conflictStart = new Date(appointmentTime);
        conflictStart.setMinutes(conflictStart.getMinutes() - 30);

        const conflictEnd = new Date(appointmentTime);
        conflictEnd.setMinutes(conflictEnd.getMinutes() + 30);

        const acceptedConflict = await Appointment.findOne({
          _id: { $ne: appointment._id },
          roomId: appointment.roomId._id,
          status: "accepted",
          appointmentDate: {
            $gte: conflictStart,
            $lte: conflictEnd,
          },
        });

        if (acceptedConflict) {
          return res.status(400).json({
            success: false,
            message:
              "There is already an accepted appointment for this room near this time",
          });
        }

        appointment.status = "accepted";
        appointment.reasonForCancel = "";

        await appointment.save();

        const autoRejected = await Appointment.updateMany(
          {
            _id: { $ne: appointment._id },
            roomId: appointment.roomId._id,
            status: "pending",
            appointmentDate: {
              $gte: conflictStart,
              $lte: conflictEnd,
            },
          },
          {
            $set: {
              status: "rejected",
              reasonForCancel:
                "Rejected automatically because another appointment was accepted for this time slot",
            },
          }
        );

        return res.status(200).json({
          success: true,
          message: "Appointment accepted successfully",
          data: appointment,
          autoRejectedCount: autoRejected.modifiedCount || 0,
        });
      }

      if (status === "rejected") {
        appointment.status = "rejected";
        appointment.reasonForCancel = reasonForCancel.trim();

        await appointment.save();

        return res.status(200).json({
          success: true,
          message: "Appointment rejected successfully",
          data: appointment,
        });
      }
    } catch (error) {
      console.error("Update managed appointment status failed:", error);

      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }
}

export default new appointmentController();