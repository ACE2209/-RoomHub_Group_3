import mongoose from "mongoose";

const WatchLaterSchema = new mongoose.Schema({
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
    required: true,
  },
  boardingHouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BoardingHouse",
    required: true,
  },
});

const WatchLater = mongoose.model("WatchLater", WatchLaterSchema);
export default WatchLater;
