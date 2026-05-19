import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { API_BASE_URL } from "../../utils/constant";
import { useNavigate } from "react-router-dom";
import { IoMailOutline, IoLockClosedOutline } from "react-icons/io5";
import FormInput from "../components/FormInput";
import "./style.css";

const ForgotPasswordPage = () => {

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [countdown, setCountdown] = useState(0);

  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  /*
  =====================
  COUNTDOWN OTP
  =====================
  */

  useEffect(() => {

    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);

  }, [countdown]);

  /*
  =====================
  SEND OTP
  =====================
  */

  const handleSendOTP = async () => {

    let newErrors = {};

    if (!email) {
      newErrors.email = "Vui lòng nhập email";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {

      await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });

      toast.success("Mã OTP đã được gửi đến email của bạn!");

      setStep(2);
      setCountdown(60);

    } catch (error) {

      setErrors({
        email: error.response?.data?.message || "Email không tồn tại"
      });

    } finally {
      setLoading(false);
    }
  };

  /*
  =====================
  VERIFY OTP
  =====================
  */

  const handleVerifyOTP = () => {

    if (!otp) {
      setErrors({
        otp: "Vui lòng nhập mã OTP"
      });
      return;
    }

    setErrors({});
    setStep(3);
  };

  /*
  =====================
  RESET PASSWORD
  =====================
  */

  const handleResetPassword = async () => {

    let newErrors = {};

    if (!newPassword) {
      newErrors.newPassword = "Vui lòng nhập mật khẩu mới";
    }

    if (newPassword.length < 6) {
      newErrors.newPassword = "Mật khẩu phải ít nhất 6 ký tự";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {

      await axios.post(`${API_BASE_URL}/auth/verify-otp-reset`, {
        email,
        otp,
        newPassword
      });

      toast.success("Đặt lại mật khẩu thành công!");

      setTimeout(() => {
        navigate("/loginpage");
      }, 2000);

    } catch (error) {

      setErrors({
        otp: error.response?.data?.message || "OTP không hợp lệ"
      });

    } finally {
      setLoading(false);
    }
  };

  /*
  =====================
  RESEND OTP
  =====================
  */

  const handleResendOTP = async () => {

    if (countdown > 0) return;

    setLoading(true);

    try {

      await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });

      toast.success("Đã gửi lại OTP!");
      setOtp("");
      setCountdown(60);

    } catch (error) {

      toast.error(error.response?.data?.message || "Không thể gửi lại OTP");

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">

      <div className="header">
        <div className="logoWrapper">
          <img src="/assets/leftLogo.png" alt="logo" className="logo" />
        </div>
      </div>

      <div className="center">
        <div className="card">

          <h2 className="title">Quên mật khẩu</h2>

          {/* STEP 1 */}

          {step === 1 && (
            <>
              <p className="footerText" style={{ marginBottom: 20 }}>
                Nhập email của bạn để nhận mã OTP đặt lại mật khẩu.
              </p>

              <FormInput
                label="Email"
                icon={<IoMailOutline size={18} />}
                placeholder="Nhập email của bạn"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors({ ...errors, email: "" });
                }}
                error={errors.email}
              />

              <button
                className="nextBtn"
                onClick={handleSendOTP}
                disabled={loading}
              >
                {loading ? "Đang gửi..." : "Gửi mã OTP"}
              </button>
            </>
          )}

          {/* STEP 2 */}

          {step === 2 && (
            <>
              <p className="footerText" style={{ marginBottom: 20 }}>
                Vui lòng nhập mã OTP đã được gửi đến email của bạn.
              </p>

              <FormInput
                label="Mã OTP"
                icon={<IoMailOutline size={18} />}
                placeholder="Nhập mã OTP"
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value);
                  setErrors({ ...errors, otp: "" });
                }}
                error={errors.otp}
              />

              <button
                className="nextBtn"
                onClick={handleVerifyOTP}
              >
                Xác nhận OTP
              </button>

              <p
                className="footerText loginLink"
                onClick={handleResendOTP}
                style={{
                  marginTop: 10,
                  opacity: countdown > 0 ? 0.5 : 1,
                  pointerEvents: countdown > 0 ? "none" : "auto"
                }}
              >
                {countdown > 0
                  ? `Gửi lại OTP (${countdown}s)`
                  : "Gửi lại OTP"}
              </p>
            </>
          )}

          {/* STEP 3 */}

          {step === 3 && (
            <>
              <p className="footerText" style={{ marginBottom: 20 }}>
                Nhập mật khẩu mới cho tài khoản của bạn.
              </p>

              <FormInput
                label="Mật khẩu mới"
                icon={<IoLockClosedOutline size={18} />}
                type="password"
                placeholder="Nhập mật khẩu mới"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setErrors({ ...errors, newPassword: "" });
                }}
                error={errors.newPassword}
              />

              <button
                className="nextBtn"
                onClick={handleResetPassword}
                disabled={loading}
              >
                {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
              </button>
            </>
          )}

          <p
            className="footerText loginLink"
            onClick={() => navigate("/loginpage")}
            style={{ marginTop: 20 }}
          >
            ← Quay lại đăng nhập
          </p>

        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;