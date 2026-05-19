/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    IoMailOutline,
    IoLockClosedOutline,
    IoEyeOutline,
    IoEyeOffOutline,
} from "react-icons/io5";

import { loginUser } from "../../controllers/authController";
import "./style.css";

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();

    const redirectMessage = location.state?.message;
    const redirectTo = location.state?.redirectTo || "/";

    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setErrorMessage("");
        setLoading(true);

        try {
            await loginUser({ email, password }, navigate);
        } catch (err) {
            setErrorMessage(err.message || "Đăng nhập thất bại");
        }

        setLoading(false);
    };

    return (
        <div className="container">
            <div className="header">
                <div className="logoWrapper">
                    <img
                        src="/assets/leftLogo.png"
                        alt="logo"
                        className="logo"
                    />
                </div>
            </div>

            <div className="center">
                <div className="card">
                    <h2 className="title">Chào mừng quay lại 👋</h2>

                    {redirectMessage && (
                        <div className="infoMessage">
                            {redirectMessage}
                        </div>
                    )}

                    {errorMessage && (
                        <div className="errorMessage">
                            {errorMessage}
                        </div>
                    )}

                    <label className="label">Email</label>
                    <div className="inputWrapper">
                        <IoMailOutline size={18} color="#7baea6" />
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Nhập email của bạn"
                        />
                    </div>

                    <label className="label">Mật khẩu</label>
                    <div className="inputWrapper">
                        <IoLockClosedOutline size={18} color="#7baea6" />
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                        <span
                            className="eye"
                            onClick={() =>
                                setShowPassword(!showPassword)
                            }
                        >
                            {showPassword ? (
                                <IoEyeOffOutline size={18} color="#7baea6" />
                            ) : (
                                <IoEyeOutline size={18} color="#7baea6" />
                            )}
                        </span>
                    </div>

                    <div
                        className="forgotLink"
                        onClick={() => navigate("/forgot-password")}
                    >
                        Quên mật khẩu?
                    </div>

                    <button
                        className="nextBtn"
                        onClick={handleLogin}
                        disabled={loading}
                    >
                        {loading ? "Đang đăng nhập..." : "Đăng nhập ✨"}
                    </button>

                    <p className="footerText">
                        Chưa có tài khoản?{" "}
                        <span
                            className="loginLink"
                            onClick={() => navigate("/signup")}
                        >
                            Tạo tài khoản ngay 💫
                        </span>
                    </p>

                    <p className="orText">HOẶC ĐĂNG NHẬP BẰNG</p>

                    <div className="socialRow">
                        <div className="socialBtn">Google</div>
                    </div>
                </div>
            </div>
        </div>
    );
}