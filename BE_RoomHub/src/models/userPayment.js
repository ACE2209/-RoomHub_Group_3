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
      enum: ["Pending", "Overdue", "Expired", "Done", "Cancel", "Paid", "Failed"],
      default: "Pending",
    },
    paymentMethod: {
      type: String,
      required: true,
enum: ["Unpaid", "Cash", "Bank Transfer", "Momo", "MoMo", "VNPay", "ZaloPay"],
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
    // Thời điểm giao dịch thực sự hoàn tất. Revenue chỉ lấy theo field này
    // (có fallback updatedAt cho dữ liệu cũ), không lấy ngày tạo giao dịch Pending.
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("UserPayment", userPaymentSchema);
