import mongoose from "mongoose";

const BankDetailsSchema = new mongoose.Schema({
  bankName: {
    type: String,
    required: true,
  },
  accountNumber: {
    type: String,
    required: true,
  },
  accountHolderName: {
    type: String,
    required: true,
  },
});

const WithdrawRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      default: "pending",
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
    },
    reasonForCancel: {
      type: String,
      required: true,
    },
    bankingAccount: BankDetailsSchema,
  },
  { timestamps: true }
);

const WithdrawRequest = mongoose.model(
  "WithdrawRequest",
  WithdrawRequestSchema
);
export default WithdrawRequest;
