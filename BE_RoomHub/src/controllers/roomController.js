import mongoose from "mongoose";
import Room from "../models/room.js";

class RoomController {
  async getRoomsByBoardingHouse(req, res) {
    try {
      const { boardingHouseId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(boardingHouseId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid boardingHouseId",
        });
      }

      const rooms = await Room.find({
        boardingHouseId,
        isAvailable: true,
      })
        .select("_id roomNumber isAvailable roomTypeId")
        .populate("roomTypeId", "typeName price peopleNumber roomSize")
        .sort({ roomNumber: 1 })
        .lean();

      return res.status(200).json({
        success: true,
        count: rooms.length,
        data: rooms,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }

  async getRoomsByRoomType(req, res) {
    try {
      const { roomTypeId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(roomTypeId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid roomTypeId",
        });
      }

      const rooms = await Room.find({
        roomTypeId,
        isAvailable: true,
      })
        .select("_id roomNumber isAvailable images description roomTypeId boardingHouseId")
        .populate("roomTypeId", "typeName price peopleNumber roomSize")
        .sort({ roomNumber: 1 })
        .lean();

      return res.status(200).json({
        success: true,
        count: rooms.length,
        data: rooms,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }

  async getRoomDetails(req, res) {
    try {
      const { roomId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(roomId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid roomId",
        });
      }

      const room = await Room.findById(roomId)
        .select("_id roomNumber isAvailable images description boardingHouseId roomTypeId")
        .populate("roomTypeId", "typeName price peopleNumber roomSize")
        .lean();

      if (!room) {
        return res.status(404).json({
          success: false,
          message: "Room not found",
        });
      }

      return res.status(200).json({
        success: true,
        data: room,
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

export default new RoomController();