import mongoose from 'mongoose';
import mongoose_delete from 'mongoose-delete';

const ImagesSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    auto: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  publicId: {
    type: String,
    default: '',
  },
  isPrimary: {
    type: Boolean,
    default: false,
  },
});

const LocationSchema = new mongoose.Schema({
  lat: {
    type: Number,
    required: true,
  },
  lon: {
    type: Number,
    required: true,
  },
});

const BoardingHouseSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      default: null,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    priceRange: {
      type: Number,
      required: true,
      min: 0,
    },
    totalRooms: {
      type: Number,
      required: false,
      min: 0,
      default: 0,
    },
    availableRooms: {
      type: Number,
      required: false,
      min: 0,
      default: 0,
    },
    electricityPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    waterPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    likes: {
      type: Number,
      default: 0,
      min: 0,
    },
    rating: {
      type: Number,
      default: 5,
    },
    boardingHouseType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BoardingHouseType',
      required: true,
    },
    address: {
      province: {
        name: { type: String, required: true },
        name_en: { type: String, required: true },
      },
      district: {
        name: { type: String, required: true },
        name_en: { type: String, required: true },
      },
      ward: {
        name: { type: String, required: true },
        name_en: { type: String, required: true },
      },
      detail: {
        type: String,
        default: '',
      },
    },

    images: [ImagesSchema],
    location: LocationSchema,
  },
  { timestamps: true }
);

BoardingHouseSchema.plugin(mongoose_delete, {
  deletedBy: true,
  overrideMethods: true,
});

const BoardingHouse = mongoose.model('BoardingHouse', BoardingHouseSchema);
export default BoardingHouse;