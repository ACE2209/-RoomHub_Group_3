import mongoose from "mongoose";

const userPaymentSchema = new mongoose.Schema(
  {
    paymentBillId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "PaymentBill",
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
      enum: ["Pending", "Paid", "Failed"],
    },
    paymentMethod: {
      type: String,
      require: true,
    },
  },
  {
    timestamps: true,
  }
);

const UserPayment = mongoose.model("UserPayment", userPaymentSchema);

export default UserPayment;
