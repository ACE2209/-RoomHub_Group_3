import mongoose from "mongoose";

const BillSchema = new mongoose.Schema({
  unitPrice: {
    type: Number,
    required: true,
    default: 0,
  },
  oldNumber: {
    type: Number,
    required: true,
  },
  newNumber: {
    type: Number,
    required: true,
  },
  quantityConsumed: {
    type: Number,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
});

const paymentBillSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    depositRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DepositRoom",
    },
    cycleNumber: {
      type: Number,
      min: 1,
    },
    periodStart: {
      type: Date,
    },
    periodEnd: {
      type: Date,
    },
    roomPrice: {
      type: Number,
      min: 0,
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
    additionalFee: [
      {
        feeName: {
          type: String,
        },
        feeAmount: {
          type: Number,
          default: 0,
        },
      },
    ],
    electricalBill: BillSchema,
    waterBill: BillSchema,
    month: {
      type: Number,
    },
    year: {
      type: Number,
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  }
);

paymentBillSchema.index(
  { roomId: 1, month: 1, year: 1 },
  {
    unique: true,
    partialFilterExpression: {
      roomId: { $exists: true },
      month: { $exists: true },
      year: { $exists: true },
    },
  }
);

paymentBillSchema.index(
  { depositRoomId: 1, cycleNumber: 1 },
  {
    unique: true,
    partialFilterExpression: {
      depositRoomId: { $type: "objectId" },
      cycleNumber: { $type: "number" },
    },
  }
);

const PaymentBill = mongoose.model("PaymentBill", paymentBillSchema);

export default PaymentBill;
