import { Account } from "../models/account.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import { generateToken, verifyToken } from "../utils/functions.js";
import { v2 as cloudinary } from "cloudinary";
import paginate from "../utils/pagination.js";

class accountController {

  async getAllAccount(req, res) {
    try {
      const accountData = await Account.find({ deleted: false }).sort({ createdAt: -1 });
      return res.status(200).json(accountData);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  async softDeleteAccount(req, res, next) {
    try {
      const { accountId } = req.params;
      const accountData = await Account.findById(accountId);

      if (!accountData) {
        return res.status(404).json({
          success: false,
          message: "Account not found"
        });
      }

      accountData.deleted = true;
      accountData.deletedAt = new Date();
      await accountData.save();

      return res.status(200).json({
        success: true,
        message: "Account successfully soft deleted"
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "An error occurred",
        error: error.message
      });
    }
  }

  async filterAccounts(req, res) {
    try {
      const { gender, role, startDate, endDate, status } = req.query;

      // Xây dựng filter cơ bản
      const filter = { deleted: false }; // Thêm filter deleted
      if (gender) filter.gender = gender;
      if (role) filter.role = role;
      if (status) filter.status = status;
      if (startDate && endDate) {
        filter.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      }

      const paginationOptions = {
        defaultPage: 1,
        defaultLimit: 10,
        maxLimit: 100,
        sortField: "createdAt",
        sortOrder: "asc",
        filter,
        allowQueryFilters: ["gender", "role", "status"],
        allowSearchFields: ["email", "username", "phone"],
        fields: "-password",
        populate: ["role"],
        includeTotalData: true,
      };

      // Gọi helper paginate
      const result = await paginate(Account, paginationOptions, req);

      return res.status(200).json(result);
    } catch (error) {
      console.error("Error filtering accounts:", error);
      return res.status(500).json({
        success: false,
        message: "Server Error",
        error: error.message,
      });
    }
  }


  async createAccount(req, res, next) {
    try {
      const { username, password, email, phoneNumber, fullname, gender, role } =
        req.body;

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = new Account({
        username,
        password: hashedPassword,
        email,
        phoneNumber,
        fullname,
        gender,
        role,
      });
      await newUser.save();

      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating account:", error);

      // Handle Mongoose validation errors
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: messages
        });
      }

      // Handle duplicate key errors
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        return res.status(400).json({
          success: false,
          message: `${field} already exists`
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message || "Error creating account"
      });
    }
  }

  async updateAccount(req, res, next) {
    try {
      const { phoneNumber, fullname, gender } = req.body;
      const { accountId } = req.params;

      if (!accountId) {
        return res.status(400).json({
          success: false,
          message: "Account ID is required"
        });
      }

      const updatedAccountData = {
        phoneNumber,
        fullname,
        gender,
      };

      const updatedAccount = await Account.findByIdAndUpdate(
        accountId,
        updatedAccountData,
        { new: true, runValidators: true }
      );

      if (!updatedAccount) {
        return res.status(404).json({
          success: false,
          message: "Account not found"
        });
      }

      res.status(200).json({
        success: true,
        data: updatedAccount
      });
    } catch (error) {
      console.error("Error updating account:", error);

      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: messages
        });
      }

      return res.status(500).json({
        success: false,
        message: error.message || "Error updating account"
      });
    }
  }

  async updateAvatar(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const account = await Account.findById(req.user.userId);

      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }

      if (!account.avatarImage) {
        account.avatarImage = {
          url: req.file.path,
          publicId: req.file.filename,
        };

        await account.save();

        return res.status(200).json({ message: "Avatar updated successfully" });
      }

      cloudinary.uploader.destroy(account.avatarImage.publicId);

      account.avatarImage.url = req.file.path;
      account.avatarImage.publicId = req.file.filename;

      await account.save();

      res.status(200).json({ message: "Avatar updated successfully" });
    } catch (error) {
      console.log("Error updating avatar:", error);
      res.status(500).json({ message: "Server Error" });
    }
  }

  async sendOTPChangeEmail(req, res) {
    try {
      const { email } = req.body;

      const existingEmail = await Account.findOne({ email });
      if (existingEmail && existingEmail._id.toString() !== req.user.userId) {
        return res.status(400).json({ message: "Email is already registered" });
      }
      const account = await Account.findById(req.user.userId);
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }

      const otp = Math.floor(100000 + Math.random() * 900000);
      const hashedOtp = await bcrypt.hash(otp.toString(), 10);
      const token = generateToken({ otp: hashedOtp }, "10m");

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: 'trantnce180829@fpt.edu.vn',
          pass: 'rjvs rqzj nsut asvr',
        },
      });

      const mailOptions = {
        from: "support@example.com",
        to: email,
        subject: "Mã OTP xác nhận thay đổi email",
        html: `
    <p>Kính gửi Anh/Chị ${account.fullname},</p>
    <p>Chúng tôi đã nhận được yêu cầu thay đổi địa chỉ email của bạn trên nền tảng XYZ.</p>
    <p>Vui lòng sử dụng mã OTP dưới đây để xác nhận yêu cầu:</p>
    <h2 style="color: #2a7ae4; text-align: center;">${otp}</h2>
    <p>Lưu ý: Mã OTP này có hiệu lực trong vòng 5 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
    <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này và giữ nguyên email hiện tại của bạn.</p>
    <p>Nếu bạn cần hỗ trợ thêm, vui lòng liên hệ với chúng tôi qua email 
    <a href="mailto:support@example.com">support@example.com</a> hoặc số điện thoại 0123-456-789.</p>
    <p>Trân trọng,<br>
    Đội ngũ Hỗ trợ Nền tảng XYZ<br>
    Email: <a href="mailto:support@example.com">support@example.com</a><br>
    Hotline: 0123-456-789</p>
  `,
      };

      await transporter.sendMail(mailOptions);
      res.status(200).json({
        token,
        email,
        message: "OTP sent successfully, please check your email.",
      });
    } catch (error) {
      console.log("Error sending OTP:", error);
      res.status(500).json({ message: "Server Error" });
    }
  }

  async verifyChangeEmail(req, res) {
    try {
      const { email, otp, token } = req.body;

      const decoded = verifyToken(token);
      const isOtpValid = await bcrypt.compare(otp.toString(), decoded.otp);
      if (!isOtpValid) {
        return res.status(400).json({ message: "Invalid OTP" });
      }

      const account = await Account.findById(req.user.userId);
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }

      account.email = email;
      await account.save();
      res.status(200).json({ message: "Email changed successfully" });
    } catch (error) {
      console.log("Error verifying email:", error);
      res.status(500).json({ message: "Server Error" });
    }
  }
  async getStaffAccounts(req, res) {
    try {
      const staffs = await Account.find({
        role: "staff",
        deleted: { $ne: true },
      }).select("_id fullname email avatarImage");

      res.status(200).json(staffs);
    } catch (error) {
      console.error("Error fetching staff accounts:", error);
      res.status(500).json({ message: "Lỗi server", error: error.message });
    }
  }

  // đổi passwod profile
  async changePassword(req, res) {
    try {
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: "All fields are required" });
      }

      const account = await Account.findOne({
        _id: req.user.userId,
      });

      if (!account) {
        return res.status(404).json({ error: "Old password is incorrect" });
      }

      const isPasswordValid = await bcrypt.compare(
        oldPassword,
        account.password
      );

      if (!isPasswordValid) {
        return res.status(400).json({ message: "Old password is incorrect" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      account.password = hashedPassword;
      await account.save();

      const token = generateToken({
        userId: account._id,
        username: account.username,
        role: account.role,
      });

      delete account.password;

      res.status(200).json({ message: "Password changed successfully", token });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Server Error" });
    }
  }
  // lấy dữ liệu profile
  async getProfile(req, res) {
    try {
      const account = await Account.findById(req.user.userId).select("-password");

      if (!account) {
        return res.status(404).json({
          success: false,
          message: "Account not found",
        });
      }

      return res.status(200).json(account);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }
  // cập nhật profile
  async updateAccountFromProfile(req, res) {
    try {
      const { fullname, phoneNumber, gender } = req.body;

      const account = await Account.findById(req.user.userId);

      if (!account) {
        return res.status(404).json({
          success: false,
          message: "Account not found",
        });
      }

      account.fullname = fullname;
      account.phoneNumber = phoneNumber;
      account.gender = gender;

      await account.save();

      return res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: account,
      });

    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: "Server error",
      });
    }
  }
}

export default new accountController();
