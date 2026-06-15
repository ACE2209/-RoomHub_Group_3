import mongoose from "mongoose";
import mongoose_delete from "mongoose-delete";

const boardingHouseTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    codeName: {
      type: String,
      required: true,
    }
  },
  {
    timestamps: true,
  }
);

boardingHouseTypeSchema.plugin(mongoose_delete, { overrideMethods: true });

const BoardingHouseType = mongoose.model(
  "BoardingHouseType",
  boardingHouseTypeSchema
);

export default BoardingHouseType;
