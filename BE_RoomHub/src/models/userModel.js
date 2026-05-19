const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: { type: String, required: true },
    role: {
    type: String,
    enum: ["student", "mentor", "admin"],
    default: "student"
    },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    avatar: { type: String },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: null,
    },
    phone: {
      type: String,
      match: /^[0-9]{10,11}$/,
      default: null,
    },
    address: {
      type: String,
      default: null,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
