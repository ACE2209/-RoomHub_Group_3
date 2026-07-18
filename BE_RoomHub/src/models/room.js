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
      default: true,
    },

    manuallySet: {
      type: Boolean,
      default: false,
    },

    images: [
      {
        imageUrl: {
          type: String,
        },
        publicId: {
          type: String,
          default: "",
        },
      },
    ],

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
      default: 0,
    },

    previousWaterReading: {
      type: Number,
      default: 0,
    },

    currentElectricityReading: {
      type: Number,
      default: 0,
    },

    currentWaterReading: {
      type: Number,
      default: 0,
    },

    additionalFees: [
      {
        feeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "RoomAdditionalFees",
        },
        feeName: {
          type: String,
        },
        feeAmount: {
          type: Number,
        },
        month: {
          type: Number,
        },
        year: {
          type: Number,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

RoomSchema.pre("save", async function (next) {
  if (this.manuallySet) {
    this.manuallySet = false;
    return next();
  }

  if (!this.isModified("rentBy") && !this.isNew) {
    return next();
  }

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

    const boardingHouseType =
      this.boardingHouseId?.boardingHouseType;

    const roomType = this.roomTypeId;

    const currentRenters = this.rentBy.length;

    if (boardingHouseType && roomType) {
      const typeCode = boardingHouseType.codeName;

      let newAvailability;

      if (
        typeCode === "nha_tro_truyen_thong" ||
        typeCode === "mini_house"
      ) {
        newAvailability = currentRenters === 0;
      } else if (typeCode === "nha_tro_kien_truc_xa") {
        const maxPeople =
          parseInt(roomType.peopleNumber) || 0;

        newAvailability = currentRenters < maxPeople;
      }

      if (
        newAvailability !== undefined &&
        this.isAvailable !== newAvailability
      ) {
        this.isAvailable = newAvailability;
      }
    }
  } catch (error) {
    console.error(
      "Error in Room pre-save middleware:",
      error
    );
  }

  next();
});

RoomSchema.statics.updateRoomAvailability =
  async function (roomId) {
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

      const boardingHouseType =
        room.boardingHouseId?.boardingHouseType;

      const roomType = room.roomTypeId;

      const currentRenters = room.rentBy.length;

      if (boardingHouseType && roomType) {
        const typeCode = boardingHouseType.codeName;

        let newAvailability;

        if (
          typeCode === "nha_tro_truyen_thong" ||
          typeCode === "mini_house"
        ) {
          newAvailability = currentRenters === 0;
        } else if (typeCode === "nha_tro_kien_truc_xa") {
          const maxPeople =
            parseInt(roomType.peopleNumber) || 0;

          newAvailability = currentRenters < maxPeople;
        }

        if (
          newAvailability !== undefined &&
          room.isAvailable !== newAvailability
        ) {
          await this.updateOne(
            { _id: roomId },
            { isAvailable: newAvailability }
          );

          room.isAvailable = newAvailability;
        }
      }

      return room;
    } catch (error) {
      console.error(
        "Error updating room availability:",
        error
      );
      throw error;
    }
  };

RoomSchema.statics.updateAllRoomsAvailability =
  async function () {
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

      const bulkOps = [];
      let updatedCount = 0;

      for (const room of rooms) {
        const boardingHouseType =
          room.boardingHouseId?.boardingHouseType;

        const roomType = room.roomTypeId;

        const currentRenters = room.rentBy.length;

        if (!boardingHouseType || !roomType) {
          continue;
        }

        const typeCode = boardingHouseType.codeName;

        let newAvailability;

        if (
          typeCode === "nha_tro_truyen_thong" ||
          typeCode === "mini_house"
        ) {
          newAvailability = currentRenters === 0;
        } else if (typeCode === "nha_tro_kien_truc_xa") {
          const maxPeople =
            parseInt(roomType.peopleNumber) || 0;

          newAvailability = currentRenters < maxPeople;
        }

        if (
          newAvailability !== undefined &&
          room.isAvailable !== newAvailability
        ) {
          bulkOps.push({
            updateOne: {
              filter: {
                _id: room._id,
              },
              update: {
                isAvailable: newAvailability,
              },
            },
          });

          updatedCount++;
        }
      }

      if (bulkOps.length > 0) {
        await this.bulkWrite(bulkOps);
      }

      return {
        updatedCount,
        totalProcessed: rooms.length,
      };
    } catch (error) {
      console.error(
        "Error updating all rooms availability:",
        error
      );
      throw error;
    }
  };

RoomSchema.methods.checkAvailabilityRules =
  async function () {
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

      const boardingHouseType =
        this.boardingHouseId?.boardingHouseType;

      const roomType = this.roomTypeId;

      const currentRenters = this.rentBy.length;

      if (!boardingHouseType || !roomType) {
        return {
          canRent: false,
          reason:
            "Missing boarding house type or room type information",
          maxCapacity: 0,
          currentOccupancy: currentRenters,
        };
      }

      const typeCode = boardingHouseType.codeName;

      if (
        typeCode === "nha_tro_truyen_thong" ||
        typeCode === "mini_house"
      ) {
        return {
          canRent: currentRenters === 0,
          reason:
            currentRenters > 0
              ? "Room already occupied"
              : "Room available",
          maxCapacity: 1,
          currentOccupancy: currentRenters,
        };
      }

      if (typeCode === "nha_tro_kien_truc_xa") {
        const maxPeople =
          parseInt(roomType.peopleNumber) || 0;

        return {
          canRent: currentRenters < maxPeople,
          reason:
            currentRenters >= maxPeople
              ? "Room at full capacity"
              : "Room available",
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
      console.error(
        "Error checking availability rules:",
        error
      );

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