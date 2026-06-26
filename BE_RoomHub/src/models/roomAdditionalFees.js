import mongoose from 'mongoose';

const roomAdditionalFeesSchema = new mongoose.Schema({
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    feeName: {
        type: String,
        required: true,
        trim: true
    },
    feeAmount: {
        type: Number,
        required: true,
        min: 0
    },
    month: {
        type: Number,
        required: true,
        min: 1,
        max: 12
    },
    year: {
        type: Number,
        required: true,
    },
}, {
    timestamps: true
});

const RoomAdditionalFees = mongoose.model('RoomAdditionalFees', roomAdditionalFeesSchema);

export default RoomAdditionalFees;