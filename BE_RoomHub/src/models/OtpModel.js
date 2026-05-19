const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  tempUserData: {
    type: {
      fullName: String,
      password: String,
      address: String,
      phone: String,
      avatar: String,
      gender: String,
    },
    required: false,
  },
});

module.exports = mongoose.model("OTP", otpSchema);
