import mongoose from "mongoose";

const DepositRoomSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    depositMonths: {
      type: Number,
      required: true,
      enum: [1, 2],
      default: 1,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "confirmed", "rejected", "refunded", "expired", "cancelled", "terminated"],
      default: "pending",
    },
    rentalTime: {
      type: Number,
      required: true,
      enum: [1, 3, 6, 12],
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    note: {
      type: String,
      default: "",
      maxlength: 500,
    },
    reasonForCancel: {
      type: String,
      default: "",
    },
    paymentDeadline: Date,
    confirmedAt: Date,
    expiredAt: Date,
    cancelledAt: Date,
    terminatedAt: Date,
  },
  {
    timestamps: true,
  }
);

const DepositRoom = mongoose.model("DepositRoom", DepositRoomSchema);

export default DepositRoom;