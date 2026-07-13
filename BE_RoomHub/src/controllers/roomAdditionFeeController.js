import RoomAdditionalFees from "../models/roomAdditionalFees.js";
import Room from "../models/room.js";
import BoardingHouse from "../models/boardingHouse.js";
import paginate from "../utils/pagination.js";

class RoomAdditionFeeController {
  async createRoomAdditionFee(req, res) {
    try {
      const { roomId, feeName, feeAmount, month, year } = req.body;
      const newFee = new RoomAdditionalFees({
        roomId,
        feeName,
        feeAmount,
        month,
        year,
      });
      await newFee.save();
      res.status(201).json(newFee);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async getAllRoomAdditionFees(req, res) {
    try {

      const accountId = req.user._id;

      const houses = await BoardingHouse.find({
        $or: [
          { ownerId: accountId },
          { staffId: accountId }
        ]
      }).select("_id");

      const rooms = await Room.find({
        boardingHouseId: {
          $in: houses.map(h => h._id)
        }
      }).select("_id");

      const additionFee = await RoomAdditionalFees.find({
        roomId: {
          $in: rooms.map(r => r._id)
        }
      })
        .populate({
          path: "roomId",
          select: "roomNumber"
        });

      res.status(200).json(additionFee);

    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  }

  //update room addition fee
  async updateRoomAdditionFee(req, res) {
    try {
      const { id } = req.params;
      const { feeName, feeAmount, month, year } = req.body;
      const updatedFee = await RoomAdditionalFees.findByIdAndUpdate(
        id,
        { feeName, feeAmount, month, year },
        { new: true }
      );
      res.status(200).json(updatedFee);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  //Delete room addition fee
  async deleteRoomAdditionFee(req, res) {
    try {
      const { id } = req.params;
      const deletedFee = await RoomAdditionalFees.findByIdAndDelete(id);
      if (!deletedFee) {
        return res.status(404).json({ message: "Fee not found" });
      }
      res.status(200).json({ message: "Fee deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async getRoomAdditionFeesByRoomId(req, res) {
    try {
      const { roomId } = req.params;
      const { month, year } = req.query;

      const filter = {
        roomId,
      };

      if (month) {
        filter.month = Number(month);
      }

      if (year) {
        filter.year = Number(year);
      }

      const fees = await RoomAdditionalFees.find(filter)
        .populate("roomId", "roomNumber")
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        data: fees,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: fees.length,
          limit: fees.length,
        },
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  async getRoomAdditionFeeForMonthlyCalculate(req, res) {
    try {
      const { roomId } = req.params;

      if (!roomId) {
        return res.status(400).json({
          success: false,
          message: "Missing required parameter: roomId",
        });
      }

      // Calculate previous month and year automatically
      const currentDate = new Date();

      // Go back one month
      currentDate.setMonth(currentDate.getMonth() - 1);

      const previousMonth = currentDate.getMonth() + 1; // getMonth() is 0-indexed
      const previousYear = currentDate.getFullYear();

      // Find all additional fees for the room in the previous month/year
      const additionalFees = await RoomAdditionalFees.find({
        roomId,
        month: previousMonth,
        year: previousYear,
      }).lean();

      // Format the response for easy integration with the payment form
      const formattedFees = additionalFees.map((fee) => ({
        feeName: fee.feeName,
        feeAmount: fee.feeAmount,
      }));

      // Calculate total amount of additional fees
      const totalAdditionalFees = formattedFees.reduce(
        (sum, fee) => sum + fee.feeAmount,
        0
      );

      return res.status(200).json({
        success: true,
        additionalFees: formattedFees,
        totalAmount: totalAdditionalFees,
        count: formattedFees.length,
        month: previousMonth,
        year: previousYear,
      });
    } catch (error) {
      console.error("Error fetching room additional fees:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default new RoomAdditionFeeController();
