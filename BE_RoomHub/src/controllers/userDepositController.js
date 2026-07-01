import DepositRoom from "../models/depositRoom.js";
import Room from "../models/room.js";

class UserDepositController {
  async createDepositRequest(req, res) {
    try {
      const accountId = req.user.userId;
      const { roomId, amount, rentalTime, startDate, endDate } = req.body;

      if (!roomId || !amount || !rentalTime || !startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "roomId, amount, rentalTime, startDate, endDate are required",
        });
      }

      const room = await Room.findById(roomId);
      if (!room) {
        return res.status(404).json({
          success: false,
          message: "Room not found",
        });
      }

      const existed = await DepositRoom.findOne({
        accountId,
        roomId,
        status: { $in: ["pending", "accepted", "confirmed"] },
      });

      if (existed) {
        return res.status(400).json({
          success: false,
          message: "You already have a deposit request for this room",
        });
      }

      const deposit = await DepositRoom.create({
        accountId,
        roomId,
        amount,
        rentalTime,
        startDate,
        endDate,
        status: "pending",
      });

      return res.status(201).json({
        success: true,
        message: "Deposit request created successfully",
        data: deposit,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }

  async getMyDeposits(req, res) {
    try {
      const accountId = req.user.userId;

      const deposits = await DepositRoom.find({ accountId })
        .populate({
          path: "roomId",
          select: "roomNumber boardingHouseId roomTypeId rentBy isAvailable",
          populate: [
            {
              path: "boardingHouseId",
              select: "name address",
            },
            {
              path: "roomTypeId",
              select: "typeName price peopleNumber",
            },
          ],
        })
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        message: "Fetched successfully",
        data: deposits,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }
}

export default new UserDepositController();