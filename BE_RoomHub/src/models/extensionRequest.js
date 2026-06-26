import mongoose from 'mongoose';

const extensionRequestSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Account',
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Room',
    },
    depositRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "DepositRoom",
    },
    currentEndDate: {
      type: Date,
      required: true,
    },
    requestedEndDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'accepted', 'rejected'],
    },
    ownerNote: {
      type: String,
      default: '',
    },
    tenantNote: {
      type: String,
      default: '',
    },
    reasonForCancel: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const ExtensionRequest = mongoose.model(
  'ExtensionRequest',
  extensionRequestSchema
);

export default ExtensionRequest;
