import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import Room from "../models/room.js";
import PaymentBill from "../models/paymentBill.js";
import paginate from "../utils/pagination.js";
import DepositRoom from "../models/depositRoom.js";
import { updateBoardingHouseRoomCounts } from '../utils/updateBoardingHouseRoomCounts.js';
import BoardingHouse from "../models/boardingHouse.js";

const attachAcceptedDepositStatus = async (rooms) => {
  const roomIds = rooms.map((room) => room._id).filter(Boolean);
  if (!roomIds.length) return rooms;

  const now = new Date();
  const activeDeposits = await DepositRoom.find({
    roomId: { $in: roomIds },
    $or: [
      { status: "confirmed" },
      { status: "accepted", paymentDeadline: { $gt: now } },
    ],
  })
    .select("roomId accountId status")
    .populate("accountId", "fullname username email")
    .lean();

  const byRoom = new Map();
  for (const deposit of activeDeposits) {
    const key = deposit.roomId.toString();
    const entry = byRoom.get(key) || { confirmed: [], reserved: [] };
    if (deposit.accountId) {
      if (deposit.status === "confirmed") entry.confirmed.push(deposit.accountId);
      else entry.reserved.push(deposit.accountId);
    }
    byRoom.set(key, entry);
  }

  return rooms.map((rawRoom) => {
    const room = rawRoom.toObject ? rawRoom.toObject() : rawRoom;
    const entry = byRoom.get(room._id.toString()) || { confirmed: [], reserved: [] };
    const typeCode = room.boardingHouseId?.boardingHouseType?.codeName;
    const isDormitory = typeCode === "nha_tro_kien_truc_xa";
    const capacity = isDormitory
      ? Math.max(1, Number(room.roomTypeId?.peopleNumber || 1))
      : 1;
    const occupiedIds = new Set(
      (Array.isArray(room.rentBy) ? room.rentBy : entry.confirmed)
        .map((account) => (account?._id || account)?.toString())
        .filter(Boolean)
    );
    const reservedIds = new Set(
      entry.reserved
        .map((account) => (account?._id || account)?.toString())
        .filter((id) => id && !occupiedIds.has(id))
    );
    const occupiedCount = occupiedIds.size;
    const reservedCount = reservedIds.size;
    const availableSlots = Math.max(0, capacity - occupiedCount - reservedCount);
    const isFull = isDormitory
      ? availableSlots === 0
      : occupiedCount + reservedCount > 0;

    return {
      ...room,
      isDormitory,
      capacity,
      occupiedCount,
      reservedCount,
      availableSlots,
      isFull,
      occupancyStatus:
        occupiedCount > 0
          ? "occupied"
          : reservedCount > 0
            ? "reserved"
            : "available",
      // Trạng thái hiển thị luôn theo người đang ở + chỗ accepted còn hạn.
      // Không để cờ chỉnh tay làm phòng đầy vẫn xuất hiện là còn trống.
      isAvailable: !isFull,
      // Deposit confirmed mới là người thuê chính thức.
      hasConfirmedDeposit: occupiedCount > 0 || entry.confirmed.length > 0,
      hasAcceptedDeposit: reservedCount > 0,
      depositStatus:
        occupiedCount > 0 || entry.confirmed.length > 0
          ? "confirmed"
          : reservedCount > 0
            ? "accepted"
            : null,
      confirmedTenants: entry.confirmed,
      reservedTenants: entry.reserved,
      // Giữ field cũ để không làm hỏng các màn hình đang sử dụng.
      acceptedTenants: [...entry.confirmed, ...entry.reserved],
    };
  });
};

class RoomController {
  async getRoomsByRoomType(req, res) {
    try {
      const { roomTypeId } = req.params;
      const { boardingHouseId } = req.query;

      if (!roomTypeId) {
        return res.status(400).json({ message: "Missing required parameters" });
      }

      const filter = {
        roomTypeId: new mongoose.Types.ObjectId(roomTypeId),
      };

      if (boardingHouseId) {
        filter.boardingHouseId = new mongoose.Types.ObjectId(boardingHouseId);
      }

      const rooms = await Room.find(filter)
        .populate("roomTypeId")
        .populate("rentBy", "fullname email")
        .populate({
          path: "boardingHouseId",
          select: "name boardingHouseType",
          populate: { path: "boardingHouseType", select: "codeName" },
        });

      const enrichedRooms = await attachAcceptedDepositStatus(rooms);
      res.status(200).json(enrichedRooms.filter((room) => room.isAvailable));
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
        status: "confirmed",
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
        populate: [{ path: "roomTypeId" },
          { path: "rentBy" },
          { path: "boardingHouseId", populate: { path: "boardingHouseType", select: "codeName" } },
        ],
        includeTotalData: true,
      };

      const result = await paginate(Room, paginationOptions, req);
      result.data = await attachAcceptedDepositStatus(result.data);

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
      const userId = req.user?.userId || req.user?._id;

      const managedBoardingHouses = await BoardingHouse.find({
        $or: [
          { ownerId: userId },
          { staffId: userId }
        ]
      }).select("_id");

      const boardingHouseIds = managedBoardingHouses.map(
        (item) => item._id
      );

      const paginationOptions = {
        defaultPage: 1,
        defaultLimit: 10,
        maxLimit: 100,
        sortField: "createdAt",
        sortOrder: "desc",

        filter: {
          boardingHouseId: {
            $in: boardingHouseIds,
          },
        },

        populate: [
          {
            path: "roomTypeId",
          },
          {
            path: "rentBy",
          },
          {
            path: "boardingHouseId",
            select: "name boardingHouseType",
            populate: { path: "boardingHouseType", select: "codeName" },
          },
        ],

        includeTotalData: true,
      };

      const result = await paginate(
        Room,
        paginationOptions,
        req
      );
      result.data = await attachAcceptedDepositStatus(result.data);

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

      // Route now uses upload.array("Room", 10) so multiple images can be sent
      const uploadedImages = (req.files || []).map((file) => ({
        imageUrl: file.path,
        publicId: file.filename,
      }));

const roomDocs = rooms.map((room) => ({
  roomNumber: room.roomNumber,
  boardingHouseId: room.boardingHouseId,
  description: room.description,
  roomTypeId: room.roomTypeId,
  isAvailable: true,
  manuallySet: false,
  images: room.images || uploadedImages,
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
        room.manuallySet = true;
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

      if (req.files && req.files.length > 0) {
        if (Array.isArray(room.images)) {
          for (const oldImage of room.images) {
            if (oldImage?.publicId) {
              await cloudinary.uploader.destroy(oldImage.publicId);
            }
          }
        }

        room.images = req.files.map((file) => ({
          imageUrl: file.path,
          publicId: file.filename,
        }));
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
        .populate({
          path: "boardingHouseId",
          populate: { path: "boardingHouseType", select: "codeName" },
        })
        .populate("rentBy");

      if (!room) {
        return res.status(404).json({
          message: "Room not found",
        });
      }

      const [enrichedRoom] = await attachAcceptedDepositStatus([room]);
      return res.status(200).json(enrichedRoom);
    } catch (error) {
      return res.status(500).json({
        message: "Server error",
        error: error.message,
      });
    }
  }
}

export default new RoomController();
