import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";

import { resetPasswordAPI } from "../../api/auth";

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Confirm password does not match");
            return;
        }

        try {
            setLoading(true);

            const res = await resetPasswordAPI({
                token,
                password,
            });

            toast.success(res.message || "Password reset successfully");

            setTimeout(() => {
                navigate("/login");
            }, 1500);
        } catch (error) {
            toast.error(
                error.response?.data?.message || "Reset password failed"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="d-flex min-vh-100 bg-light align-items-center justify-content-center p-3">

            <div
                className="bg-white shadow-lg rounded-4 p-4 p-md-5 w-100"
                style={{ maxWidth: "420px" }}
            >
                <h3
                    className="text-center fw-bold mb-2"
                    style={{ color: "#ff6b00" }}
                >
                    Reset Password
                </h3>

                <p className="text-center text-muted mb-4">
                    Enter your new password
                </p>

                <form onSubmit={handleSubmit}>
                    {/* New Password */}
                    <div className="mb-3">
                        <label className="form-label fw-semibold">
                            New Password
                        </label>

                        <input
                            type="password"
                            className="form-control"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {/* Confirm Password */}
                    <div className="mb-3">
                        <label className="form-label fw-semibold">
                            Confirm Password
                        </label>

                        <input
                            type="password"
                            className="form-control"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    {/* Button */}
                    <button
                        className="btn w-100 py-2"
                        disabled={loading}
                        style={{
                            backgroundColor: "#ff6b00",
                            borderColor: "#ff6b00",
                            color: "#fff",
                            borderRadius: "10px",
                            fontWeight: "600"
                        }}
                    >
                        {loading ? "Resetting..." : "Reset Password"}
                    </button>

                    {/* Back to login */}
                    <div className="text-center mt-3">
                        <Link
                            to="/login"
                            className="text-decoration-none fw-semibold"
                            style={{ color: "#ff6b00" }}
                        >
                            ← Back to Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;