import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import googleAuth from 'google-auth-library';
import nodemailer from 'nodemailer';
import { generateToken, verifyToken } from '../utils/functions.js';

import { Account } from '../models/account.js';
dotenv.config();

class AuthController {
  resetTokenBlacklist = new Set();
  async getAccountFromToken(req, res) {
    const user = await Account.findOne({ username: req.user.username }).select(
      '-password'
    );
    res.status(200).json(user);
  }

  async sendOTPRegister(req, res) {
    try {
      const account = req.body;

      const existingUser = await Account.findOne({
        $or: [
          { email: account.email },
          { username: account.username },
          { phoneNumber: account.phoneNumber },
        ],
      });

      if (existingUser) {
        return res.status(409).json({
          message: 'Email or Username or Phone Number already exists',
        });
      }

      const otp = Math.floor(100000 + Math.random() * 900000);
      const hashedOtp = await bcrypt.hash(otp.toString(), 10);
      const token = generateToken({ otp: hashedOtp }, '10m');

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'trantnce180829@fpt.edu.vn',
          pass: 'rjvs rqzj nsut asvr',
        },
      });
      const mailOptions = {
        from: 'support@example.com',
        to: account.email,
        subject: 'Mã OTP xác minh tài khoản của bạn',
        html: `
  <p>Kính gửi Anh/Chị ${account.fullname},</p>
  <p>Chúng tôi đã nhận được yêu cầu xác minh tài khoản của bạn trên nền tảng RoomHub.</p>
  <p>Mã OTP của bạn là:</p>
  <h2 style="color: #2a7ae4; text-align: center;">${otp}</h2>
  <p>Lưu ý: Mã OTP này có hiệu lực trong vòng 5 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
  <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
  <p>Nếu bạn cần hỗ trợ thêm, vui lòng liên hệ với chúng tôi qua email <a href="mailto:support@example.com">support@example.com</a> hoặc số điện thoại 0123-456-789.</p>
  <p>Trân trọng,<br>
  Đội ngũ Hỗ trợ Nền tảng RoomHub<br>
  Email: <a href="mailto:support@example.com">support@example.com</a><br>
  Hotline: 0123-456-789</p>
  `,
      };

      await transporter.sendMail(mailOptions);

      res.status(200).json({
        token,
        account,
        message: 'OTP sent successfully, please check your email.',
      });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: 'An unexpected error occurred' });
    }
  }

  async registerWithGoogle(req, res) {
    try {
      const user = new Account(req.body);
      user.password = await bcrypt.hash(user.password, 10);
      const createdAccount = await user.save();
      if (!createdAccount) {
        return res.status(422).json({ message: 'Account creation failed' });
      }

      const token = generateToken({
        userId: user._id,
        username: user.username,
        role: user.role,
      });

      delete user.password;
      res.status(201).json({
        token,
        user,
      });
    } catch (error) {
      console.log(error.message);
      if (error.code === 11000) {
        return res.status(409).json({
          message: 'Username or Email or Phone Number already exist!',
        });
      }
      res.status(500).json({ message: 'An unexpected error occurred' });
    }
  }

  async verifyRegister(req, res) {
    try {
      const { token, otp, account } = req.body;

      const decoded = verifyToken(token);
      const isOtpValid = await bcrypt.compare(otp.toString(), decoded.otp);
      if (!isOtpValid) {
        return res.status(400).json({ message: 'Invalid OTP' });
      }

      const user = new Account(account);
      user.password = await bcrypt.hash(user.password, 10);
      const createdAccount = await user.save();
      if (!createdAccount) {
        return res.status(422).json({ message: 'Account creation failed' });
      }

      const accessToken = generateToken({
        userId: user._id,
        username: user.username,
        role: user.role,
      });

      delete user.password;
      res.status(201).json({
        token: accessToken,
        user,
      });
    } catch (error) {
      console.log(error.message);
      if (error.code === 11000) {
        return res.status(409).json({
          message: 'Username or Email or Phone Number already exist!',
        });
      }
      res.status(500).json({ message: 'An unexpected error occurred' });
    }
  }

  async login(req, res) {
    try {
      const { username, password, remember } = req.body;
      const user = await Account.findOne({ username: username });

      if (!user) {
        return res
          .status(401)
          .json({ message: 'Username or Password is incorrect' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res
          .status(401)
          .json({ message: 'Username or Password is incorrect' });
      }
      const token = generateToken(
        {
          userId: user._id,
          username: user.username,
          role: user.role,
        },
        remember ? '7d' : '1d'
      );
      delete user.password;
      res.status(200).json({
        token,
        user,
      });
    } catch (error) {
      console.log(error.message);
      res.status(500).json({ message: 'An unexpected error occurred' });
    }
  }

  async loginWithGoogle(req, res) {
    const { credential, clientId, remember } = req.body;
    const client = new googleAuth.OAuth2Client({
      clientId: process.env.GOOGLE_CLIENT_ID,
    });
    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      const user = await Account.findOne({ email: payload.email }).select(
        '-password'
      );

      if (!user) {
        return res.status(200).json({
          isRegistered: false,
          message: 'User not registered. Please complete registration.',
          user: payload,
        });
      }

      const token = generateToken(
        {
          userId: user._id,
          username: user.username,
          role: user.role,
        },
        remember ? '7d' : '1d'
      );

      res.status(200).json({
        isRegistered: true,
        token,
        user,
      });
    } catch (error) {
      console.log(error.message);
      res.status(401).json({ message: 'Invalid Google Token' });
    }
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      const user = await Account.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'Email not found' });
      }

      const resetToken = generateToken({ userId: user._id }, '1h');

      const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'todohongy@gmail.com',
          pass: 'onbg hyaz wxcd vmgw',
        },
      });
      const mailOptions = {
        from: 'support@example.com',
        to: email,
        subject: 'Đặt lại mật khẩu tài khoản của bạn',
        html: `
  <p>Kính gửi Anh/Chị ${user.fullname},</p>
  <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn trên nền tảng XYZ.</p>
  <p>Vui lòng nhấp vào liên kết bên dưới để đặt lại mật khẩu:</p>
  <p><a href="${resetLink}" style="color: #2a7ae4; text-decoration: none;">Đặt lại mật khẩu</a></p>
  <p>Lưu ý: Liên kết này chỉ có hiệu lực trong vòng 1 giờ. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
  <p>Nếu bạn cần hỗ trợ thêm, vui lòng liên hệ với chúng tôi qua email <a href="mailto:support@example.com">support@example.com</a> hoặc số điện thoại 0123-456-789.</p>
  <p>Trân trọng,<br>
  Đội ngũ Hỗ trợ Nền tảng XYZ<br>
  Email: <a href="mailto:support@example.com">support@example.com</a><br>
  Hotline: 0123-456-789</p>
  `,
      };

      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: 'Reset link sent to email' });
    } catch (error) {
      res.status(500).json({ message: 'An unexpected error occurred' });
    }
  }

  async forgotPasswordMobile(req, res) {
    try {
      const { email } = req.body;
      const user = await Account.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'Email not found' });
      }

      const resetToken = generateToken({ userId: user._id }, '1h');

      // const resetLink = `mobile://resetPassword/${resetToken}`;
      const resetLink = `${process.env.NGROK_URL}/reset-password-mobile/${resetToken}`;

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'todohongy@gmail.com',
          pass: 'onbg hyaz wxcd vmgw',
        },
      });

      const mailOptions = {
        from: 'support@example.com',
        to: email,
        subject: 'Đặt lại mật khẩu trên ứng dụng XYZ (Mobile)',
        html: `
  <p>Kính gửi Anh/Chị ${user.fullname},</p>
  <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn trên nền tảng XYZ.</p>
  <p>Vui lòng nhấp vào liên kết bên dưới để đặt lại mật khẩu:</p>
  <p><a href="${resetLink}" style="color: #2a7ae4; text-decoration: none;">Đặt lại mật khẩu</a></p>
  <p>Lưu ý: Liên kết này chỉ có hiệu lực trong vòng 1 giờ. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
  <p>Nếu bạn cần hỗ trợ thêm, vui lòng liên hệ với chúng tôi qua email <a href="mailto:support@example.com">support@example.com</a> hoặc số điện thoại 0123-456-789.</p>
  <p>Trân trọng,<br>
  Đội ngũ Hỗ trợ Nền tảng XYZ<br>
  Email: <a href="mailto:support@example.com">support@example.com</a><br>
  Hotline: 0123-456-789</p>
  `,
      };

      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: 'Mobile reset link sent to email' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ message: 'An unexpected error occurred' });
    }
  }

  async resetPasswordMobile(req, res) {
    const token = req.params.token;

    const deepLink = `mobile://resetPassword/${token}`;

    const userAgent = req.headers['user-agent'];
    const isMobile = /Android|iPhone|iPad/i.test(userAgent);

    if (isMobile) {
      res.redirect(deepLink);
    } else {
      // Nếu không phải mobile, show thông báo hoặc redirect về trang web
      res.send('Please open this link on your mobile device.');
    }
  }

  resetPassword = async (req, res) => {
    try {
      const { token, password } = req.body;

      if (this.resetTokenBlacklist.has(token)) {
        return res.status(400).json({ message: 'Reset token has been used' });
      }

      const decoded = verifyToken(token);
      const user = await Account.findById(decoded.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      user.password = await bcrypt.hash(password, 10);
      await user.save();

      this.resetTokenBlacklist.add(token);
      res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(400).json({ message: 'Token expired' });
      }
      res.status(500).json({ message: 'An unexpected error occurred' });
    }
  };
}

export default new AuthController();
