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
    },

    appointmentDate: {
      type: Date,
      required: true,
    },

    reasonForCancel: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

AppointmentSchema.statics.updateExpiredAppointments = async function () {
  return this.updateMany(
    {
      status: "pending",
      appointmentDate: { $lt: new Date() },
    },
    {
      status: "canceled",
      reasonForCancel: "Appointment expired",
    }
  );
};

AppointmentSchema.virtual("isExpired").get(function () {
  return this.status === "pending" && new Date() > this.appointmentDate;
});

const Appointment = mongoose.model("Appointment", AppointmentSchema);

export default Appointment;