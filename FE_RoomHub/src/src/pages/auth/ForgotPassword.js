import { useState } from "react";
import { toast } from "react-toastify";
import { forgotPasswordAPI } from "../../api/auth";
import { Link } from "react-router-dom";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);

            const res = await forgotPasswordAPI({ email });

            toast.success(res.message || "Reset link sent to email");
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong");
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
                <h3 className="text-center fw-bold mb-2" style={{ color: "#ff6b00" }}>
                    Forgot Password
                </h3>

                <p className="text-center text-muted mb-4">
                    Enter your email to receive reset link
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label fw-semibold">
                            Email
                        </label>

                        <input
                            type="email"
                            className="form-control"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

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
                        {loading ? "Sending..." : "Send Reset Link"}
                    </button>

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

export default ForgotPassword;