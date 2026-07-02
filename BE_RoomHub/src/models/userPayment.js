import mongoose from "mongoose";

const userPaymentSchema = new mongoose.Schema(
  {
    paymentBillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentBill",
      default: null,
    },
    depositRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DepositRoom",
      default: null,
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Account",
    },
    paymentAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["Pending", "Done", "Cancel", "Paid", "Failed"],
      default: "Pending",
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["Unpaid", "Cash", "Bank Transfer", "Momo", "MoMo", "VNPay"],
      default: "Unpaid",
    },
     orderId: {
      type: String,
      unique: true,
      sparse: true,
    },
    orderInfo: {
      type: String,
      default: "",
    },
    transactionNo: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("UserPayment", userPaymentSchema);
