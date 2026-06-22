import mongoose from "mongoose";

const FavoriteBHSchema = new mongoose.Schema({
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

const FavoriteBH = mongoose.model("FavoriteBH", FavoriteBHSchema);
export default FavoriteBH;
