import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import Room from "../models/room.js";
import PaymentBill from "../models/paymentBill.js";
import paginate from "../utils/pagination.js";
import DepositRoom from "../models/depositRoom.js";
import { updateBoardingHouseRoomCounts } from '../utils/updateBoardingHouseRoomCounts.js';


class RoomController {
  async getRoomsByRoomType(req, res) {
    try {
      const { roomTypeId } = req.params;
      const { boardingHouseId } = req.query;

      if (!roomTypeId) {
        return res.status(400).json({ message: "Missing required parameters" });
      }

      const depositRoomIds = await DepositRoom.find({
        status: "confirmed",
      }).distinct("roomId");

      const filter = {
        roomTypeId: new mongoose.Types.ObjectId(roomTypeId),
        isAvailable: true,
        _id: { $nin: depositRoomIds },
      };

      if (boardingHouseId) {
        filter.boardingHouseId = new mongoose.Types.ObjectId(boardingHouseId);
      }

      const availableRooms = await Room.find(filter);

      res.status(200).json(availableRooms);
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  }

  async getRoomsEligibleForBill(req, res) {
    try {
      const { boardingHouseId } = req.params;
      const now = new Date();
      const lastMonth = now.getMonth() === 0 ? 12 : now.getMonth();
      const lastYear =
        now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

      if (!boardingHouseId) {
        return res.status(400).json({ message: "boardingHouseId là bắt buộc" });
      }

      const paidRooms = await PaymentBill.find({
        month: lastMonth,
        year: lastYear,
      }).distinct("roomId");

      const validDeposits = await DepositRoom.find({
        status: { $regex: /^confirmed$/i },
        startDate: { $lte: now },
        endDate: { $gte: now },
      }).select("roomId");

      const validRoomIds = validDeposits.map((d) => d.roomId.toString());

      const eligibleRooms = await Room.find({
        _id: { $in: validRoomIds, $nin: paidRooms },
        boardingHouseId: boardingHouseId,
      })
        .populate("roomTypeId")
        .sort({ roomNumber: 1 });

      return res.status(200).json(eligibleRooms);
    } catch (error) {
      return res.status(500).json({ message: "Server error", error });
    }
  }

  async getRoomsByBoardingHouse(req, res) {
    try {
      const { boardingHouseId } = req.params;

      if (!boardingHouseId) {
        return res.status(400).json({ message: "Missing required parameters" });
      }

      const filter = {
        boardingHouseId: new mongoose.Types.ObjectId(boardingHouseId),
      };

      const paginationOptions = {
        defaultPage: 1,
        defaultLimit: 10,
        maxLimit: 100,
        sortField: "createdAt",
        sortOrder: "desc",
        filter,
        populate: [{ path: "roomTypeId" }, { path: "rentBy" }],
        includeTotalData: true,
      };

      const result = await paginate(Room, paginationOptions, req);

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }

  async getAllRooms(req, res) {
    try {
      const paginationOptions = {
        defaultPage: 1,
        defaultLimit: 10,
        maxLimit: 100,
        sortField: "createdAt",
        sortOrder: "desc",

        populate: [
          {
            path: "roomTypeId",
          },
          {
            path: "rentBy",
          },
          {
            path: "boardingHouseId",
            select: "name",
          },
        ],

        includeTotalData: true,
      };

      const result = await paginate(
        Room,
        paginationOptions,
        req
      );

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }

  async addRoom(req, res) {
    try {
      const roomData = req.body;
      const rooms = Array.isArray(roomData) ? roomData : [roomData];

      for (const room of rooms) {
        const { roomNumber, boardingHouseId, description, roomTypeId } = room;

        if (!roomNumber || !boardingHouseId || !roomTypeId || !description) {
          return res.status(400).json({
            message: "Missing required parameters",
            missingFields: {
              roomNumber,
              boardingHouseId,
              description,
              roomTypeId,
            },
          });
        }
      }

      // Check for duplicate room numbers in the same boarding house
      const roomNumbers = rooms.map((room) => room.roomNumber);
      const duplicateCheck = await Room.find({
        boardingHouseId: rooms[0].boardingHouseId,
        roomNumber: { $in: roomNumbers },
      });

      if (duplicateCheck.length > 0) {
        const existingNumbers = duplicateCheck.map((room) => room.roomNumber);
        return res.status(400).json({
          message: "Some rooms already exist",
          duplicateRooms: existingNumbers,
        });
      }

      const roomDocs = rooms.map((room) => ({
        roomNumber: room.roomNumber,
        boardingHouseId: room.boardingHouseId,
        description: room.description,
        roomTypeId: room.roomTypeId,
        isAvailable: true,
        images: room.images || null,
      }));

      // Save all rooms
      const savedRooms = await Room.insertMany(roomDocs);

      try {
        const boardingHouseId = rooms[0].boardingHouseId;
        await updateBoardingHouseRoomCounts(boardingHouseId);
      } catch (updateError) {
        // Don't throw error to not affect response
        console.error("Error updating room counts:", updateError);
      }

      res.status(201).json({
        message: "Room added successfully",
        room: savedRooms[0],
        count: savedRooms.length,
      });
    } catch (error) {
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }

  async updateRoom(req, res) {
    try {
      const { roomId } = req.params;
      const {
        roomNumber,
        boardingHouseId,
        description,
        roomTypeId,
        isAvailable,
        previousElectricityReading,
        previousWaterReading,
        currentElectricityReading,
        currentWaterReading,
      } = req.body;

      if (!roomNumber || !boardingHouseId || !roomTypeId || !description) {
        return res.status(400).json({ message: "Missing required parameters" });
      }

      const room = await Room.findById(roomId);
      if (!room) {
        return res.status(400).json({ message: "Room not found" });
      }

      if (room.roomNumber != roomNumber) {
        const existingRoom = await Room.findOne({
          roomNumber,
          boardingHouseId,
        });

        if (existingRoom) {
          return res.status(400).json({ message: "Room already exists" });
        }
        room.roomNumber = roomNumber;
      }

      room.description = description;
      room.roomTypeId = roomTypeId;

      console.log("isAvailable received:", isAvailable);  // Debug

      if (isAvailable !== undefined && isAvailable !== null && isAvailable !== '') {
        const boolValue = isAvailable === true || isAvailable === 'true';
        room.isAvailable = boolValue;
        room.manuallySet = true;  // ✅ Set flag
      }
      if (
        previousElectricityReading !== undefined &&
        previousElectricityReading !== null
      ) {
        room.previousElectricityReading = Number(previousElectricityReading);
      }
      if (previousWaterReading !== undefined && previousWaterReading !== null) {
        room.previousWaterReading = Number(previousWaterReading);
      }
      if (
        currentElectricityReading !== undefined &&
        currentElectricityReading !== null
      ) {
        room.currentElectricityReading = Number(currentElectricityReading);
      }

      if (currentWaterReading !== undefined && currentWaterReading !== null) {
        room.currentWaterReading = Number(currentWaterReading);
      }

      if (req.file) {
        if (room?.images?.publicId) {
          await cloudinary.uploader.destroy(room.images.publicId);
        }

        room.images = {
          imageUrl: req.file.path,
          publicId: req.file.filename,
        };
      }

      await room.save();
      res.status(201).json({ message: "Room updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  }

  async deleteRoom(req, res) {
    try {
      const { roomId } = req.params;
      if (!roomId) {
        return res.status(400).json({ message: "Missing required parameters" });
      }

      const roomToDelete = await Room.findById(roomId);
      if (!roomToDelete) {
        return res.status(404).json({ message: "Room not found" });
      }

      const boardingHouseId = roomToDelete.boardingHouseId;

      await Room.findByIdAndDelete(roomId).then(() => {
        updateBoardingHouseRoomCounts(boardingHouseId);
      });

      res.status(200).json({ message: "Room deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Server error", error });
    }
  }

  async getRoomDetails(req, res) {
    try {
      const { roomId } = req.params;

      const room = await Room.findById(roomId)
        .populate("roomTypeId")
        .populate("boardingHouseId")
        .populate("rentBy");

      if (!room) {
        return res.status(404).json({
          message: "Room not found",
        });
      }

      return res.status(200).json(room);
    } catch (error) {
      return res.status(500).json({
        message: "Server error",
        error: error.message,
      });
    }
  }
}

export default new RoomController();