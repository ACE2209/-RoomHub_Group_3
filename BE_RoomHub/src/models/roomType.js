import mongoose from "mongoose";
import mongoose_delete from "mongoose-delete";

const RoomTypeSchema = new mongoose.Schema({
  boardingHouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "BoardingHouse",
    required: true,
  },
  typeName: {
    type: String,
    required: true,
  },
  facilities: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Facility",
    },
  ],
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  image: {
    imageUrl: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      default: "",
    }
  },
  roomSize: {
    type: String,
    default: ""
  },
  peopleNumber: {
    type: String,
    default: 0
  }
});

RoomTypeSchema.plugin(mongoose_delete, { overrideMethods: true });

const RoomType = mongoose.model("RoomType", RoomTypeSchema);
export default RoomType;