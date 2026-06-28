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
    status: {
      type: String,
      enum: ["pending", "accepted", "confirmed", "rejected", "refunded"],
      default: "pending",
    },
    rentalTime: {
      type: Number,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    reasonForCancel: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const DepositRoom = mongoose.model("DepositRoom", DepositRoomSchema);

export default DepositRoom;
