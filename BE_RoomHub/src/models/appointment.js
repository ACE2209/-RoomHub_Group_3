import mongoose from "mongoose";

const AppointmentSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },

    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "canceled", "completed"],
      default: "pending",
    },

    note: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },

    appointmentDate: {
      type: Date,
      required: true,
    },

    reasonForCancel: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

AppointmentSchema.index({ accountId: 1, roomId: 1, status: 1 });
AppointmentSchema.index({ roomId: 1, status: 1, appointmentDate: 1 });
AppointmentSchema.index({ appointmentDate: 1 });

AppointmentSchema.statics.updateExpiredAppointments = async function () {
  const now = new Date();

  const expiredPending = await this.updateMany(
    {
      status: "pending",
      appointmentDate: { $lte: now },
    },
    {
      $set: {
        status: "canceled",
        reasonForCancel: "Appointment expired",
      },
    }
  );

  const completedAccepted = await this.updateMany(
    {
      status: "accepted",
      appointmentDate: { $lte: now },
    },
    {
      $set: {
        status: "completed",
      },
    }
  );

  return {
    expiredPending,
    completedAccepted,
  };
};

AppointmentSchema.virtual("isExpired").get(function () {
  return (
    ["pending", "accepted"].includes(this.status) &&
    new Date() > this.appointmentDate
  );
});

const Appointment = mongoose.model("Appointment", AppointmentSchema);

export default Appointment;