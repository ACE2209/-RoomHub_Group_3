import mongoose from 'mongoose';
import mongooseDelete from 'mongoose-delete';

const ReportSchema = new mongoose.Schema(
  {
    reportType: {
      type: String,
      enum: ['review', 'room', 'boardingHouse'],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'reportTypeRef',
      required: true,
    },
    reportTypeRef: {
      type: String,
      required: true,
      enum: ['Review', 'Room', 'BoardingHouse'],
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    details: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'resolved', 'rejected'],
      default: 'pending',
    },
    detailReport: {
      type: String,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
    },
    images: [
      {
        imageUrl: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          default: '',
        },
      },
    ],
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

ReportSchema.plugin(mongooseDelete, {
  overrideMethods: 'all',
});

const Report = mongoose.model('Report', ReportSchema);
export default Report;
