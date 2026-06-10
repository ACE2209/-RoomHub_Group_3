import mongoose from "mongoose";
import mongooseDelete from "mongoose-delete";

const ReportSchema = new mongoose.Schema(
  {
    reportType: {
      type: String,
      enum: ["review", "boardingHouse"],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "reportTypeRef",
      required: true,
    },
    reportTypeRef: {
      type: String,
      required: true,
      enum: ["Review", "BoardingHouse"],
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
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
      default: "pending",
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
    },
    images: [
      {
        imageUrl: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          default: "",
        },
      },
    ],
  },
  { timestamps: true }
);

// Add mongoose-delete plugin without 'deletedAt'
ReportSchema.plugin(mongooseDelete, {
  overrideMethods: "all",
});

const Report = mongoose.model("Report", ReportSchema);
export default Report;