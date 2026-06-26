import mongoose from "mongoose";

const refundRequestSchema = new mongoose.Schema(
  {
    depositRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DepositRoom",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    originalDepositAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    totalDamageAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
    },
    processedByRole: {
      type: String,
      enum: ["owner", "staff"],
    },
    processedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    reason: {
      type: String,
      required: true,
    },
    reasonForCancel: {
      type: String,
      default: "",
    },
    damageAssessment: [
      {
        damageName: {
          type: String,
          required: false,
        },
        estimatedCost: {
          type: Number,
          required: false,
          min: 0,
          default: 0,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Virtual field để tính số tiền hoàn trả thực tế
refundRequestSchema.virtual("actualRefundAmount").get(function () {
  return Math.max(0, this.originalDepositAmount - this.totalDamageAmount);
});

// Middleware để tự động tính totalDamageAmount từ damageAssessment
refundRequestSchema.pre("save", function (next) {
  if (this.damageAssessment && this.damageAssessment.length > 0) {
    this.totalDamageAmount = this.damageAssessment.reduce(
      (total, damage) => total + (damage.estimatedCost || 0),
      0
    );
  } else {
    this.totalDamageAmount = 0;
  }
  next();
});

// Middleware để set processedAt khi status thay đổi
refundRequestSchema.pre("save", function (next) {
  if (
    this.isModified("status") &&
    this.status !== "pending" &&
    !this.processedAt
  ) {
    this.processedAt = new Date();
  }
  next();
});

// Index để tối ưu query
refundRequestSchema.index({ userId: 1, status: 1 });
refundRequestSchema.index({ depositRoomId: 1 });
refundRequestSchema.index({ processedBy: 1 });
refundRequestSchema.index({ createdAt: -1 });

const RefundRequest = mongoose.model("RefundRequest", refundRequestSchema);
export default RefundRequest;
