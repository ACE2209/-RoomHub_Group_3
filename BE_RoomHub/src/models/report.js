import mongoose from 'mongoose';

const ReportSchema = new mongoose.Schema(
  {
    reportType: {
      type: String,
      enum: ['review', 'room'],
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
      enum: ['Review', 'Room'],
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
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Report = mongoose.model('Report', ReportSchema);
export default Report;
