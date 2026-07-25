import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { loginAPI } from "../../api/auth";
import {
    getRoleHomePath,
    normalizeRole,
} from "../../utils/roleNavigation";

const getSafeReturnPath = (from) => {
    const path =
        typeof from === "string"
            ? from
            : typeof from?.pathname === "string"
            ? `${from.pathname}${from.search || ""}${from.hash || ""}`
            : "";

    if (!path.startsWith("/") || path.startsWith("//")) {
        return "";
    }

    return path;
};

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        username: "",
        password: "",
        remember: false,
    });

    const handleChange = (e) => {
        const { name, value, checked, type } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!formData.username.trim()) {
            toast.error("Username is required");
            return;
        }

        if (!formData.password.trim()) {
            toast.error("Password is required");
            return;
        }

        try {
            setLoading(true);

            const data = await loginAPI(formData);

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            toast.success("Login successful");

            const role = normalizeRole(data.user?.role);
            const requestedPath = getSafeReturnPath(location.state?.from);
            const destination =
                role === "user" && requestedPath
                    ? requestedPath
                    : getRoleHomePath(role);

            setTimeout(() => {
                navigate(destination, { replace: true });
            }, 500);
        } catch (error) {
            toast.error(error.response?.data?.message || "Login failed");
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
                                Tìm không gian sống lý tưởng của bạn.
                            </h1>

                            <p
                                style={{
                                    fontSize: "18px",
                                    maxWidth: "600px",
                                }}
                            >
                                Hệ thống quản lý và tìm kiếm phòng trọ hàng
                                đầu, giúp kết nối người thuê và chủ nhà một
                                cách minh bạch và hiệu quả.
                            </p>
                        </div>

                        <small>© 2026 RoomHub.</small>
                    </div>
                </div>

                {/* Right Side */}
                <div className="w-100 w-lg-50 d-flex align-items-center justify-content-center bg-light">
                    <div
                        className="bg-white shadow-lg p-4 p-md-5 rounded-4"
                        style={{
                            width: "100%",
                            maxWidth: "450px",
                        }}
                    >
                        <div className="mb-4">
                            <h2 className="fw-bold">Chào mừng trở lại</h2>

                            <p className="text-muted mb-0">
                                Vui lòng đăng nhập vào RoomHub
                            </p>
                        </div>

                        {location.state?.notice && (
                            <div
                                className="alert alert-warning py-2 px-3"
                                role="status"
                            >
                                {location.state.notice}
                            </div>
                        )}

                        <form onSubmit={handleLogin}>
                            {/* Username */}
                            <div className="mb-3">
                                <label className="form-label" htmlFor="login-username">
                                    Username
                                </label>

                                <div className="input-group">
                                    <span className="input-group-text">
                                        <Mail size={18} />
                                    </span>

                                    <input
                                        id="login-username"
                                        type="text"
                                        className="form-control"
                                        name="username"
                                        placeholder="Enter username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        autoComplete="username"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className="mb-3">
                                <label className="form-label" htmlFor="login-password">
                                    Password
                                </label>

                                <div className="input-group">
                                    <span className="input-group-text">
                                        <Lock size={18} />
                                    </span>

                                    <input
                                        id="login-password"
                                        type={showPassword ? "text" : "password"}
                                        className="form-control"
                                        name="password"
                                        placeholder="Enter password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        autoComplete="current-password"
                                    />

                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={
                                            showPassword
                                                ? "Hide password"
                                                : "Show password"
                                        }
                                    >
                                        {showPassword ? (
                                            <EyeOff size={18} />
                                        ) : (
                                            <Eye size={18} />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Remember + Forgot */}
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <div className="form-check" />

                                <Link
                                    to="/forgot-password"
                                    className="text-decoration-none fw-semibold"
                                    style={{
                                        color: "#c2410c",
                                    }}
                                >
                                    Forgot Password?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                className="btn w-100 py-2 text-white"
                                style={{
                                    backgroundColor: "#c2410c",
                                    borderColor: "#c2410c",
                                }}
                                disabled={loading}
                            >
                                {loading ? "Loading..." : "Login"}
                            </button>
                        </form>

                        <div className="text-center mt-4">
                            Don't have an account?

                            <Link
                                to="/register"
                                className="ms-2 text-decoration-none fw-semibold"
                                style={{
                                    color: "#c2410c",
                                }}
                            >
                                Register
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Login;
