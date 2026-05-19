const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const OTP = require("../models/otpModel");
const { validateEmail } = require("../utils/validation");

const generateAccessToken = (user) => {
  return jwt.sign(
    { _id: user._id, isAdmin: user.isAdmin, status: user.status },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "1h" }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { _id: user._id, isAdmin: user.isAdmin, status: user.status },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" }
  );
};

const register = async (req, res) => {
  try {
    const { fullName, email, password, address, phone, avatar, gender } =
      req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Full name, email, and password are required",
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email address",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 5 * 60 * 1000;
    const hashedPassword = await bcrypt.hash(password, 10);

    const existingOTP = await OTP.findOne({ email });

    if (existingOTP) {
      await OTP.findOneAndUpdate(
        { email },
        {
          otp: otpCode,
          expiresAt: otpExpires,
          tempUserData: {
            fullName,
            password: hashedPassword,
            address,
            phone,
            avatar,
            gender,
          },
        },
        { new: true }
      );
    } else {
      await OTP.create({
        email,
        otp: otpCode,
        expiresAt: otpExpires,
        tempUserData: {
          fullName,
          password: hashedPassword,
          address,
          phone,
          avatar,
          gender,
        },
      });
    }

    await sendOTP(email, otpCode, "register");

    res.status(200).json({
      success: true,
      message:
        "An OTP has been sent to your email. Please verify to complete registration.",
      data: { email },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Incorrect email or password. Please try again.",
      });
    }

    if (user.status === "inactive") {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive. Please contact support.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Incorrect email or password. Please try again.",
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      path: "/",
      sameSite: "strict",
    });

    const { password: _, ...userData } = user._doc;
    res.json({
      success: true,
      message: "Login successful",
      data: { ...userData, accessToken },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        "An error occurred while processing your request. Please try again later.",
    });
  }
};

const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res
        .status(400)
        .json({ success: false, message: "No refresh token found" });
    }

    res.clearCookie("refreshToken");

    return res
      .status(200)
      .json({ success: true, message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Logout failed" });
  }
};

const requestRefreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res
        .status(401)
        .json({ success: false, message: "No refresh token provided." });
    }

    const user = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: false,
      path: "/",
      sameSite: "strict",
    });

    res.status(200).json({ success: true, accessToken: newAccessToken });
  } catch (error) {
    res
      .status(403)
      .json({ success: false, message: "Refresh token invalid or expired." });
  }
};

const verifyOTPRegister = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const storedOTP = await OTP.findOne({ email, otp });
    if (!storedOTP) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (storedOTP.expiresAt < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP Expired",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already registered",
      });
    }

    const { fullName, password, address, phone, avatar, gender } =
      storedOTP.tempUserData;

    const newUser = new User({
      fullName,
      email,
      password,
      address,
      phone,
      avatar,
      gender,
    });

    await newUser.save();
    await OTP.deleteOne({ email, otp });

    res.status(201).json({
      success: true,
      message: "Registration successful! Please log in to continue.",
      data: { email },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "No account found with that email." });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 5 * 60 * 1000;

    const existingOTP = await OTP.findOne({ email });

    if (existingOTP) {
      await OTP.findOneAndUpdate(
        { email },
        {
          otp: otpCode,
          expiresAt: otpExpires,
        },
        { new: true }
      );
    } else {
      await OTP.create({
        email,
        otp: otpCode,
        expiresAt: otpExpires,
      });
    }

    await sendOTP(email, otpCode, "reset");

    res.json({ success: true, message: "OTP sent. Please check your email." });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const resetPasswordWithOTP = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const storedOTP = await OTP.findOne({ email, otp });
    if (!storedOTP || storedOTP.expiresAt < Date.now()) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired OTP." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findOneAndUpdate({ email }, { password: hashedPassword });

    await OTP.deleteOne({ email });
    res.json({
      success: true,
      message: "Password has been reset successfully.",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const sendOTP = async (email, otp, type = "register") => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    let subject, htmlContent;

    if (type === "register") {
      subject = "🔐 Your OTP Code for Registration";
      htmlContent = `
        <div style="max-width: 600px; margin: auto; padding: 20px; font-family: Arial, sans-serif; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #007bff; text-align: center;">🔐 Complete Your Registration</h2>
          <p style="font-size: 16px; color: #333;">Hello,</p>
          <p style="font-size: 16px; color: #333;">Thank you for signing up with Clothing Store! To complete your registration, please use the OTP code below:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin: 0; font-size: 24px; color: #007bff;">${otp}</h3>
          </div>
          <p style="font-size: 14px; color: #666;">This code is valid for <strong>5 minutes</strong>.</p>
          <p style="font-size: 16px; color: #333;">Click the button below to verify your OTP and activate your account:</p>
          <p style="font-size: 12px; color: #666; text-align: center;">If you did not request this registration, please ignore this email or contact our support team.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">&copy; 2025 Clothing Store. All rights reserved.</p>
        </div>
      `;
    } else if (type === "reset") {
      subject = "🔐 Your OTP Code for Password Reset";
      htmlContent = `
        <div style="max-width: 600px; margin: auto; padding: 20px; font-family: Arial, sans-serif; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #007bff; text-align: center;">🔐 Reset Your Password</h2>
          <p style="font-size: 16px; color: #333;">Hello,</p>
          <p style="font-size: 16px; color: #333;">You have requested to reset your password for Clothing Store. Please use the OTP code below:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin: 0; font-size: 24px; color: #007bff;">${otp}</h3>
          </div>
          <p style="font-size: 14px; color: #666;">This code is valid for <strong>5 minutes</strong>.</p>
          <p style="font-size: 16px; color: #333;">Click the button below to reset your password:</p>
          <p style="font-size: 12px; color: #666; text-align: center;">If you did not request a password reset, please ignore this email or contact our support team.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
          <p style="font-size: 12px; color: #999; text-align: center;">&copy; 2025 Clothing Store. All rights reserved.</p>
        </div>
      `;
    }

    const mailOptions = {
      from: `"ED Planner" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new Error("Failed to send OTP email.");
  }
};

module.exports = {
  register,
  login,
  requestPasswordReset,
  requestRefreshToken,
  logout,
  resetPasswordWithOTP,
  verifyOTPRegister,
};
