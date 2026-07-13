import mongoose from "mongoose";

const paymentTransactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["deposit", "rent"],
      required: true,
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    depositRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DepositRoom",
    },
    rentBillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentBill",
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["vnpay", "momo"],
      required: true,
    },
    txnRef: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "expired"],
      default: "pending",
    },
    expiredAt: {
      type: Date,
      required: true,
    },
    payUrl: String,
    rawData: Object,
  },
  { timestamps: true }
);

export default mongoose.model("PaymentTransaction", paymentTransactionSchema);