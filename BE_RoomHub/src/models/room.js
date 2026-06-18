import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema(
  {
    boardingHouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BoardingHouse",
      required: true,
    },
    rentBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Account",
        required: true,
      },
    ],
    roomNumber: {
      type: String,
      required: true,
    },
    isAvailable: {
      type: Boolean,
      required: true,
    },
    images: {
      imageUrl: {
        type: String,
      },
      publicId: {
        type: String,
        default: "",
      },
    },
    roomTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoomType",
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    previousElectricityReading: {
      type: Number,
    },
    previousWaterReading: {
      type: Number,
    },
    currentElectricityReading: {
      type: Number,
    },
    currentWaterReading: {
      type: Number,
    },
  },
  { timestamps: true }
);

// ===== FIX 1: Cải thiện Pre-save Middleware =====
RoomSchema.pre("save", async function (next) {
  // Chỉ chạy logic này khi rentBy được modified hoặc document mới
  if (this.isModified("rentBy") || this.isNew) {
    try {
      console.log(`🔍 Pre-save triggered for room: ${this.roomNumber}`);

      // Populate với error handling tốt hơn
      await this.populate([
        {
          path: "boardingHouseId",
          populate: {
            path: "boardingHouseType",
            select: "codeName",
          },
        },
        {
          path: "roomTypeId",
          select: "peopleNumber",
        },
      ]);

      const boardingHouseType = this.boardingHouseId?.boardingHouseType;
      const roomType = this.roomTypeId;
      const currentRenters = this.rentBy.length;

      if (boardingHouseType && roomType) {
        const typeCode = boardingHouseType.codeName;
        let newAvailability;

        if (typeCode === "nha_tro_truyen_thong" || typeCode === "mini_house") {
          newAvailability = currentRenters === 0;
        } else if (typeCode === "nha_tro_kien_truc_xa") {
          const maxPeople = parseInt(roomType.peopleNumber) || 0;
          newAvailability = currentRenters < maxPeople;
        }

        // Chỉ update nếu có thay đổi
        if (
          newAvailability !== undefined &&
          this.isAvailable !== newAvailability
        ) {
          this.isAvailable = newAvailability;
        } else {
          console.log(`ℹ️ No availability change needed`);
        }
      } else {
        console.log(`⚠️ Missing required data:`, {
          hasBoardingHouseType: !!boardingHouseType,
          hasRoomType: !!roomType,
        });
      }
    } catch (error) {
      console.error("❌ Error in Room pre-save middleware:", error);
      // Không throw error để không block save operation
    }
  }
  next();
});

// ===== FIX 2: Cải thiện Static Method =====
RoomSchema.statics.updateRoomAvailability = async function (roomId) {
  try {
    const room = await this.findById(roomId)
      .populate({
        path: "boardingHouseId",
        populate: {
          path: "boardingHouseType",
          select: "codeName",
        },
      })
      .populate({
        path: "roomTypeId",
        select: "peopleNumber",
      });

    if (!room) {
      throw new Error("Room not found");
    }

    const boardingHouseType = room.boardingHouseId?.boardingHouseType;
    const roomType = room.roomTypeId;
    const currentRenters = room.rentBy.length;

    if (boardingHouseType && roomType) {
      const typeCode = boardingHouseType.codeName;
      let newAvailability;

      if (typeCode === "nha_tro_truyen_thong" || typeCode === "mini_house") {
        newAvailability = currentRenters === 0;
      } else if (typeCode === "nha_tro_kien_truc_xa") {
        const maxPeople = parseInt(roomType.peopleNumber) || 0;
        newAvailability = currentRenters < maxPeople;
      }

      if (
        newAvailability !== undefined &&
        room.isAvailable !== newAvailability
      ) {
        // FIX: Sử dụng updateOne thay vì save để tránh trigger middleware
        await this.updateOne({ _id: roomId }, { isAvailable: newAvailability });

        // Update object để return đúng data
        room.isAvailable = newAvailability;
      } else {
        console.log(`ℹ️ No update needed for room ${room.roomNumber}`);
      }
    } else {
      console.log(`⚠️ Missing required data for room ${room.roomNumber}`);
    }

    return room;
  } catch (error) {
    console.error("❌ Error updating room availability:", error);
    throw error;
  }
};

// ===== FIX 3: Cải thiện Bulk Update Method =====
RoomSchema.statics.updateAllRoomsAvailability = async function () {
  try {
    const rooms = await this.find()
      .populate({
        path: "boardingHouseId",
        populate: {
          path: "boardingHouseType",
          select: "codeName",
        },
      })
      .populate({
        path: "roomTypeId",
        select: "peopleNumber",
      });

    let updatedCount = 0;
    const bulkOps = [];

    for (const room of rooms) {
      const boardingHouseType = room.boardingHouseId?.boardingHouseType;
      const roomType = room.roomTypeId;
      const currentRenters = room.rentBy.length;

      if (boardingHouseType && roomType) {
        const typeCode = boardingHouseType.codeName;
        let newAvailability;

        if (typeCode === "nha_tro_truyen_thong" || typeCode === "mini_house") {
          newAvailability = currentRenters === 0;
        } else if (typeCode === "nha_tro_kien_truc_xa") {
          const maxPeople = parseInt(roomType.peopleNumber) || 0;
          newAvailability = currentRenters < maxPeople;
        }

        // Chỉ update nếu có thay đổi
        if (
          newAvailability !== undefined &&
          room.isAvailable !== newAvailability
        ) {
          bulkOps.push({
            updateOne: {
              filter: { _id: room._id },
              update: { isAvailable: newAvailability },
            },
          });
          updatedCount++;
          console.log(
            `📝 Queued update for room ${room.roomNumber}: ${room.isAvailable} → ${newAvailability}`
          );
        }
      } else {
        console.log(
          `⚠️ Skipping room ${room.roomNumber} - missing required data`
        );
      }
    }

    // FIX: Sử dụng bulkWrite để performance tốt hơn
    if (bulkOps.length > 0) {
      await this.bulkWrite(bulkOps);
      console.log(`✅ Bulk update completed: ${updatedCount} rooms updated`);
    } else {
      console.log(`ℹ️ No rooms needed updating`);
    }

    return { updatedCount, totalProcessed: rooms.length };
  } catch (error) {
    console.error("❌ Error updating all rooms availability:", error);
    throw error;
  }
};

// ===== FIX 4: Cải thiện Instance Method =====
RoomSchema.methods.checkAvailabilityRules = async function () {
  try {
    await this.populate([
      {
        path: "boardingHouseId",
        populate: {
          path: "boardingHouseType",
          select: "codeName",
        },
      },
      {
        path: "roomTypeId",
        select: "peopleNumber",
      },
    ]);

    const boardingHouseType = this.boardingHouseId?.boardingHouseType;
    const roomType = this.roomTypeId;
    const currentRenters = this.rentBy.length;

    if (!boardingHouseType || !roomType) {
      return {
        canRent: false,
        reason: "Missing boarding house type or room type information",
        maxCapacity: 0,
        currentOccupancy: currentRenters,
      };
    }

    const typeCode = boardingHouseType.codeName;

    if (typeCode === "nha_tro_truyen_thong" || typeCode === "mini_house") {
      return {
        canRent: currentRenters === 0,
        reason:
          currentRenters > 0
            ? "Room already occupied (traditional/mini house)"
            : "Room available",
        maxCapacity: 1,
        currentOccupancy: currentRenters,
      };
    } else if (typeCode === "nha_tro_kien_truc_xa") {
      const maxPeople = parseInt(roomType.peopleNumber) || 0;
      return {
        canRent: currentRenters < maxPeople,
        reason:
          currentRenters >= maxPeople
            ? "Room at full capacity"
            : `Room available (${currentRenters}/${maxPeople})`,
        maxCapacity: maxPeople,
        currentOccupancy: currentRenters,
      };
    }

    return {
      canRent: false,
      reason: "Unknown boarding house type",
      maxCapacity: 0,
      currentOccupancy: currentRenters,
    };
  } catch (error) {
    console.error("❌ Error checking availability rules:", error);
    return {
      canRent: false,
      reason: "Error checking availability rules",
      maxCapacity: 0,
      currentOccupancy: 0,
    };
  }
};

const Room = mongoose.model("Room", RoomSchema);
export default Room;

// ===== FIX 5: Cải thiện Usage Examples =====

export const addRenter = async (roomId, accountId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log(`👤 Adding renter ${accountId} to room ${roomId}`);

    const room = await Room.findById(roomId).session(session);
    if (!room) {
      throw new Error("Room not found");
    }

    // Check if renter already exists
    if (room.rentBy.some((id) => id.toString() === accountId.toString())) {
      throw new Error("Renter already exists in this room");
    }

    // Check availability rules trước khi thêm
    const availabilityCheck = await room.checkAvailabilityRules();
    console.log(`🔍 Availability check:`, availabilityCheck);

    if (!availabilityCheck.canRent) {
      throw new Error(availabilityCheck.reason);
    }

    // Thêm renter
    room.rentBy.push(accountId);
    await room.save({ session });

    await session.commitTransaction();

    return {
      success: true,
      message: "Renter added successfully",
      room,
      availabilityInfo: availabilityCheck,
    };
  } catch (error) {
    await session.abortTransaction();
    console.error(`❌ Error adding renter:`, error.message);
    return {
      success: false,
      error: error.message,
    };
  } finally {
    session.endSession();
  }
};

export const removeRenter = async (roomId, accountId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const room = await Room.findById(roomId).session(session);
    if (!room) {
      throw new Error("Room not found");
    }

    const initialLength = room.rentBy.length;
    room.rentBy = room.rentBy.filter((id) => !id.equals(accountId));

    if (room.rentBy.length === initialLength) {
      throw new Error("Renter not found in this room");
    }

    await room.save({ session });

    await session.commitTransaction();
    console.log(`✅ Renter removed successfully from room ${room.roomNumber}`);

    return {
      success: true,
      message: "Renter removed successfully",
      room,
    };
  } catch (error) {
    await session.abortTransaction();
    console.error(`❌ Error removing renter:`, error.message);
    return {
      success: false,
      error: error.message,
    };
  } finally {
    session.endSession();
  }
};

// ===== FIX 6: Cải thiện Cron Job =====
import cron from "node-cron";

// Chạy vào 2:00 AM hàng ngày
cron.schedule("0 2 * * *", async () => {
  console.log(
    `Starting daily availability sync at ${new Date().toISOString()}`
  );
  try {
    const result = await Room.updateAllRoomsAvailability();
    console.log(
      `✅ Daily availability sync completed: ${result.updatedCount}/${result.totalProcessed} rooms updated`
    );
  } catch (error) {
    console.error("❌ Error in daily availability sync:", error);
  }
});

// ===== DEBUGGING UTILITIES =====

// Debug function để check một room cụ thể
export const debugRoom = async (roomId) => {
  try {
    console.log(`🔍 Debugging room: ${roomId}`);

    const room = await Room.findById(roomId)
      .populate("boardingHouseId")
      .populate("roomTypeId")
      .populate("rentBy");

    if (!room) {
      console.log(`❌ Room not found`);
      return;
    }

    console.log(`📊 Room Debug Info:`, {
      roomNumber: room.roomNumber,
      isAvailable: room.isAvailable,
      rentersCount: room.rentBy.length,
      renters: room.rentBy.map((r) => r._id),
      boardingHouseId: room.boardingHouseId?._id,
      roomTypeId: room.roomTypeId?._id,
      lastUpdated: room.updatedAt,
    });

    // Populate boarding house type
    await room.populate({
      path: "boardingHouseId",
      populate: {
        path: "boardingHouseType",
        select: "codeName",
      },
    });

    const availabilityCheck = await room.checkAvailabilityRules();
    console.log(`🔍 Availability Rules Check:`, availabilityCheck);

    return {
      room,
      availabilityCheck,
    };
  } catch (error) {
    console.error(`❌ Error debugging room:`, error);
  }
};

export const testRoomStatusUpdate = async (roomId) => {
  console.log(`🧪 Testing room status update for: ${roomId}`);

  await debugRoom(roomId);

  try {
    const result = await Room.updateRoomAvailability(roomId);
  } catch (error) {
    console.error(`❌ Manual update failed:`, error.message);
  }

  await debugRoom(roomId);
};