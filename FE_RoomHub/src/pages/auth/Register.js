import { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";

import {
    sendOTPAPI,
    registerAPI,
} from "../../api/auth";

const Register = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [registerToken, setRegisterToken] = useState("");
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        email: "",
        fullname: "",
        phoneNumber: "",
        gender: "male",
        role: "user",
        otp: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    // Gửi OTP
    const handleSendOTP = async () => {
        if (!formData.email) {
            toast.error("Please enter your email first!");
            return;
        }
        try {
            setLoading(true);
            const data = await sendOTPAPI(formData);
            setRegisterToken(data.token);
            setOtpSent(true);
            toast.success("OTP has been sent to email");
        } catch (error) {
            toast.error(
                error.response?.data?.message || "Send OTP failed"
            );
        } finally {
            setLoading(false);
        }
    };

    // Đăng ký
    const handleRegister = async (e) => {
        e.preventDefault();
        if (!formData.otp) {
            toast.error("Please enter the OTP code!");
            return;
        }

        try {
            setLoading(true);
            const payload = {
                token: registerToken,
                otp: formData.otp,
                account: {
                    username: formData.username,
                    password: formData.password,
                    email: formData.email,
                    fullname: formData.fullname,
                    phoneNumber: formData.phoneNumber,
                    gender: formData.gender,
                    role: formData.role,
                },
            };

            const data = await registerAPI(payload);
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            toast.success("Register successful! Redirecting...");

            setTimeout(() => {
                navigate("/login");
            }, 1500); // Tăng nhẹ delay để user kịp đọc thông báo thành công

        } catch (error) {
            toast.error(
                error.response?.data?.message || "Register failed"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <ToastContainer />

            <div className="min-vh-100 d-flex">
                {/* Left Side */}
                <div
                    className="d-none d-lg-flex position-relative text-white"
                    style={{
                        width: "170%",
                        backgroundImage:
                            "url('https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=2000')",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                >
                    <div
                        className="position-absolute top-0 start-0 w-100 h-100"
                        style={{
                            background:
                                "linear-gradient(to right, rgba(13,28,46,.75), rgba(13,28,46,.3))",
                        }}
                    />

                    <div className="position-relative d-flex flex-column justify-content-between p-5 w-100">
                        <div className="d-flex align-items-center gap-2">
                            <img
                                src="/image/logo.png"
                                alt="logo"
                                style={{
                                    height: "250px",
                                }}
                            />
                        </div>

                        <div>
                            <h1
                                className="fw-bold mb-3"
                                style={{
                                    fontSize: "48px",
                                }}
                            >
                                Join RoomHub Today.
                            </h1>

                            <p
                                style={{
                                    fontSize: "18px",
                                    maxWidth: "600px",
                                }}
                            >
                                Create your account and start
                                managing rooms, tenants and
                                properties with ease.
                            </p>
                        </div>

                        <small>
                            © 2026 RoomHub. All rights reserved.
                        </small>
                    </div>
                </div>

                {/* Right Side */}
                <div className="w-100 d-flex align-items-center justify-content-center bg-light">
                    <div
                        className="bg-white shadow-lg p-4 p-md-5 rounded-4"
                        style={{
                            width: "100%",
                            maxWidth: "500px",
                            color: "#ff6b00",

                        }}
                    >
                        <h2 className="text-center mb-2 fw-bold" style={{ color: "#ff6b00" }}>
                            RoomHub
                        </h2>
                        <p className="text-center text-muted mb-4">
                            {!otpSent ? "Create your account" : "Verification Step"}
                        </p>

                        <form onSubmit={handleRegister}>
                            {/* KHU VỰC ĐIỀN THÔNG TIN (Sẽ mờ đi khi đã gửi OTP để tránh phân tâm) */}
                            <div style={{ opacity: otpSent ? 0.4 : 1, pointerEvents: otpSent ? 'none' : 'auto', transition: 'all 0.3s' }}>
                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Full Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="fullname"
                                        placeholder="John Doe"
                                        value={formData.fullname}
                                        onChange={handleChange}
                                        required={!otpSent}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Username</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="username"
                                        placeholder="johndoe123"
                                        value={formData.username}
                                        onChange={handleChange}
                                        required={!otpSent}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Email</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        name="email"
                                        placeholder="name@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required={!otpSent}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Phone Number</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="phoneNumber"
                                        placeholder="0912345678"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        required={!otpSent}
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label fw-semibold">Password</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        name="password"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required={!otpSent}
                                    />
                                </div>

                                <div className="mb-4">
                                    <label className="form-label fw-semibold">Gender</label>
                                    <select
                                        className="form-select"
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            {/* KHU VỰC ĐIỀU KHIỂN & OTP */}
                            {!otpSent ? (
                                <button
                                    type="button"
                                    className="btn w-100 py-2 fw-bold"
                                    onClick={handleSendOTP}
                                    disabled={loading}
                                    style={{
                                        borderRadius: "10px",
                                        backgroundColor: "#ff6b00",
                                        borderColor: "#ff6b00",
                                        color: "#fff"
                                    }}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Sending OTP...
                                        </>
                                    ) : (
                                        "Send OTP Verification"
                                    )}
                                </button>
                            ) : (
                                /* Giao diện nhập OTP cực kỳ rõ ràng */
                                <div className="p-3 bg-light border border-primary-subtle rounded-3 animation-fade-in" style={{ borderStyle: 'dashed !important' }}>
                                    <div className="alert alert-info py-2 px-3 small mb-3 text-center border-0" role="alert">
                                        📩 We've sent a <strong>verification code</strong> to <br />
                                        <span className="text-primary fw-bold">{formData.email}</span>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-bold text-primary text-uppercase tracking-wider small">
                                            Enter OTP Code
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control text-center fw-bold fs-4"
                                            name="otp"
                                            placeholder="••••••"
                                            maxLength={6}
                                            style={{ letterSpacing: "8px" }}
                                            value={formData.otp}
                                            onChange={handleChange}
                                            autoFocus
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn btn-success w-100 py-2 fw-bold mb-2 shadow-sm"
                                        disabled={loading}
                                        style={{ borderRadius: "10px" }}
                                    >
                                        {loading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                Verifying & Registering...
                                            </>
                                        ) : (
                                            "Confirm & Register ✓"
                                        )}
                                    </button>

                                    <div className="text-center">
                                        <button
                                            type="button"
                                            className="btn btn-link btn-sm text-decoration-none text-muted p-0"
                                            onClick={() => setOtpSent(false)}
                                        >
                                            ← Change info / Edit Email
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="text-center mt-4 text-muted small">
                                Already have an account?
                                <Link to="/login" className="ms-2 fw-bold text-decoration-none" style={{ color: "#ff6b00" }}>
                                    Login
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>

            </div >
        </>

    );
}

export default Register;