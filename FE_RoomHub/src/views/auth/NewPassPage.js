import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    IoLockClosedOutline,
    IoEyeOutline,
    IoEyeOffOutline,
} from "react-icons/io5";
import { changePassword } from "../../controllers/userApi";
import { toast } from "react-toastify";
import FormInput from "../components/FormInput";
import "./style.css";

export default function NewPassPage() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));

    const [showOld, setShowOld] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [passwordData, setPasswordData] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [errors, setErrors] = useState({});

    const handleChange = (field, value) => {
        setPasswordData({
            ...passwordData,
            [field]: value,
        });

        setErrors({
            ...errors,
            [field]: "",
        });
    };

    const validate = () => {
        let newErrors = {};

        if (!passwordData.oldPassword) {
            newErrors.oldPassword = "Vui lòng nhập mật khẩu hiện tại";
        }

        if (!passwordData.newPassword) {
            newErrors.newPassword = "Vui lòng nhập mật khẩu mới";
        } else if (passwordData.newPassword.length < 6) {
            newErrors.newPassword = "Mật khẩu phải có ít nhất 6 ký tự";
        }

        if (!passwordData.confirmPassword) {
            newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
        } else if (passwordData.newPassword !== passwordData.confirmPassword) {
            newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        try {
            await changePassword({
                userId: user._id,
                oldPassword: passwordData.oldPassword,
                newPassword: passwordData.newPassword,
            });

            toast.success("Đổi mật khẩu thành công");
            navigate("/profile");
        } catch (error) {
            setErrors({
                ...errors,
                oldPassword:
                    error.response?.data?.message || "Mật khẩu hiện tại không đúng",
            });
        }
    };

    return (
        <div className="container">
            {/* LOGO */}
            <div className="header">
                <img src="/assets/leftLogo.png" alt="logo" className="logo bigLogo" />
            </div>

            {/* CARD */}
            <div className="center">
                <div className="card">
                    <h2 className="title">Đổi mật khẩu</h2>

                    <p className="footerText">
                        Mật khẩu mới của bạn phải khác với mật khẩu đã sử dụng trước đó.
                    </p>

                    {/* Mật khẩu hiện tại */}
                    <FormInput
                        label="Mật khẩu hiện tại"
                        icon={<IoLockClosedOutline size={18} color="#999" />}
                        type={showOld ? "text" : "password"}
                        value={passwordData.oldPassword}
                        placeholder="Nhập mật khẩu hiện tại"
                        onChange={(e) => handleChange("oldPassword", e.target.value)}
                        error={errors.oldPassword}
                    >
                        <span className="eye" onClick={() => setShowOld(!showOld)}>
                            {showOld ? (
                                <IoEyeOffOutline size={18} />
                            ) : (
                                <IoEyeOutline size={18} />
                            )}
                        </span>
                    </FormInput>

                    {/* Mật khẩu mới */}
                    <FormInput
                        label="Mật khẩu mới"
                        icon={<IoLockClosedOutline size={18} color="#999" />}
                        type={showPass ? "text" : "password"}
                        value={passwordData.newPassword}
                        placeholder="Nhập mật khẩu mới"
                        onChange={(e) => handleChange("newPassword", e.target.value)}
                        error={errors.newPassword}
                    >
                        <span className="eye" onClick={() => setShowPass(!showPass)}>
                            {showPass ? (
                                <IoEyeOffOutline size={18} />
                            ) : (
                                <IoEyeOutline size={18} />
                            )}
                        </span>
                    </FormInput>

                    {/* Xác nhận mật khẩu */}
                    <FormInput
                        label="Xác nhận mật khẩu"
                        icon={<IoLockClosedOutline size={18} color="#999" />}
                        type={showConfirm ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        placeholder="Nhập lại mật khẩu mới"
                        onChange={(e) => handleChange("confirmPassword", e.target.value)}
                        error={errors.confirmPassword}
                    >
                        <span className="eye" onClick={() => setShowConfirm(!showConfirm)}>
                            {showConfirm ? (
                                <IoEyeOffOutline size={18} />
                            ) : (
                                <IoEyeOutline size={18} />
                            )}
                        </span>
                    </FormInput>

                    {/* BUTTON */}
                    <button className="nextBtn" onClick={handleSubmit}>
                        Đổi mật khẩu
                    </button>

                    {/* BACK */}
                    <p className="footerText loginLink" onClick={() => navigate("/profile")}>
                        ← Quay lại hồ sơ
                    </p>
                </div>
            </div>
        </div>
    );
}