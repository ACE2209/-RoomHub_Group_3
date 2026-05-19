import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    IoPersonOutline,
    IoMailOutline,
    IoLockClosedOutline,
    IoEyeOutline,
    IoEyeOffOutline,
} from "react-icons/io5";

import { registerUser, verifyOTPRegister } from "../../controllers/authController";
import { toast } from "react-toastify";
import "./style.css";

import FormInput from "../components/FormInput";
import { validateRegister } from "../../utils/validateRegister";

export default function RegisterPage() {
    const navigate = useNavigate();

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showOTPForm, setShowOTPForm] = useState(false);
    const [otp, setOtp] = useState("");

    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        avatar: "avatars/default.png",
        gender: "male",
        phone: "",
        address: "",
    });

    const handleChange = (field, value) => {
        setFormData({
            ...formData,
            [field]: value,
        });

        setErrors({
            ...errors,
            [field]: "",
        });
    };

    /*
    ===========================
    ĐĂNG KÝ
    ===========================
    */

    const handleRegister = async () => {
        const validationErrors = validateRegister(formData);

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);

        try {
            const { confirmPassword, ...data } = formData;

            const response = await registerUser({
                ...data,
                isAdmin: false,
            });

            if (response.success) {
                toast.success(response.message || "Đăng ký thành công, vui lòng nhập OTP");
                setShowOTPForm(true);
            }
        } catch (error) {

            if (error?.errors) {
                setErrors(error.errors);
            }

            else if (error?.message) {
                setErrors({
                    email: error.message,
                });
            }

            else {
                toast.error("Đăng ký thất bại");
            }
        }

        setLoading(false);
    };

    /*
    ===========================
    XÁC THỰC OTP
    ===========================
    */

    const handleVerifyOTP = async () => {
        if (!otp) {
            toast.error("Vui lòng nhập mã OTP");
            return;
        }

        setLoading(true);

        try {
            const response = await verifyOTPRegister(
                formData.email,
                otp
            );

            if (response.success) {
                toast.success("Xác thực tài khoản thành công 🎉");

                setTimeout(() => {
                    navigate("/loginpage");
                }, 1500);
            }
        } catch (error) {
            toast.error(error.message || "Mã OTP không hợp lệ");
        }

        setLoading(false);
    };

    /*
    ===========================
    GỬI LẠI OTP
    ===========================
    */

    const handleResendOTP = async () => {
        setLoading(true);

        try {
            await registerUser({
                ...formData,
                isAdmin: false,
            });

            toast.success("Đã gửi lại mã OTP ✉️");
            setOtp("");
        } catch (error) {
            toast.error("Không thể gửi lại OTP");
        }

        setLoading(false);
    };

    return (
        <div className="container">

            <div className="header">
                <img
                    src="/assets/leftLogo.png"
                    alt="logo"
                    className="logo registerLogo"
                />
            </div>

            <div className="center">
                <div className="card">

                    <h2 className="title">Tạo tài khoản</h2>

                    {!showOTPForm ? (
                        <>

                            <FormInput
                                label="Họ và tên"
                                icon={<IoPersonOutline size={18} />}
                                placeholder="Nguyễn Văn A"
                                value={formData.fullName}
                                onChange={(e) =>
                                    handleChange("fullName", e.target.value)
                                }
                                error={errors.fullName}
                            />

                            <FormInput
                                label="Email"
                                icon={<IoMailOutline size={18} />}
                                placeholder="Nhập email"
                                value={formData.email}
                                onChange={(e) =>
                                    handleChange("email", e.target.value)
                                }
                                error={errors.email}
                            />

                            <FormInput
                                label="Số điện thoại"
                                placeholder="Nhập số điện thoại"
                                value={formData.phone}
                                onChange={(e) =>
                                    handleChange("phone", e.target.value)
                                }
                                error={errors.phone}
                            />

                            <FormInput
                                label="Mật khẩu"
                                icon={<IoLockClosedOutline size={18} />}
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••"
                                value={formData.password}
                                onChange={(e) =>
                                    handleChange("password", e.target.value)
                                }
                                error={errors.password}
                            >
                                <span
                                    className="eye"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                >
                                    {showPassword ? (
                                        <IoEyeOffOutline />
                                    ) : (
                                        <IoEyeOutline />
                                    )}
                                </span>
                            </FormInput>

                            <FormInput
                                label="Xác nhận mật khẩu"
                                icon={<IoLockClosedOutline size={18} />}
                                type="password"
                                placeholder="Nhập lại mật khẩu"
                                value={formData.confirmPassword}
                                onChange={(e) =>
                                    handleChange(
                                        "confirmPassword",
                                        e.target.value
                                    )
                                }
                                error={errors.confirmPassword}
                            />

                            <FormInput
                                label="Địa chỉ"
                                placeholder="Nhập địa chỉ"
                                value={formData.address}
                                onChange={(e) =>
                                    handleChange("address", e.target.value)
                                }
                                error={errors.address}
                            />

                            <button
                                className="nextBtn"
                                onClick={handleRegister}
                                disabled={loading}
                            >
                                {loading ? "Đang xử lý..." : "Tiếp tục ✨"}
                            </button>

                        </>
                    ) : (
                        <>

                            <FormInput
                                label="Nhập mã OTP"
                                placeholder="Nhập mã OTP"
                                value={otp}
                                onChange={(e) =>
                                    setOtp(e.target.value)
                                }
                            />

                            <button
                                className="nextBtn"
                                onClick={handleVerifyOTP}
                                disabled={loading}
                            >
                                {loading ? "Đang xác thực..." : "Xác thực OTP"}
                            </button>

                            <p
                                style={{ cursor: "pointer", marginTop: 10 }}
                                onClick={handleResendOTP}
                            >
                                Gửi lại mã OTP
                            </p>

                        </>
                    )}

                    <p className="footerText">
                        Đã có tài khoản?{" "}
                        <span
                            className="loginLink"
                            onClick={() => navigate("/loginpage")}
                        >
                            Đăng nhập ngay
                        </span>
                    </p>

                    <p className="orText">HOẶC ĐĂNG KÝ BẰNG</p>

                    <div className="socialRow">
                        <div className="socialBtn">Google</div>
                    </div>

                </div>
            </div>

        </div>
    );
}