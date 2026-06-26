import mongoose from "mongoose";

const RevenueSchema = new mongoose.Schema({
  boardingHouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BoardingHouse",
    required: true,
  },
  month: {
    type: Number,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  totalRevenue: {
    type: Number,
    required: true,
  },
  transactionCount: {
    type: Number,
    required: true,
  },
  transactions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentBill",
    },
  ],
});

const Revenue = mongoose.model("Revenue", RevenueSchema);
export default Revenue;
