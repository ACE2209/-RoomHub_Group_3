import { useState } from "react";
import {
    useNavigate,
    Link,
} from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";

import { loginAPI } from "../api/auth";

const Login = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        username: "",
        password: "",
        remember: false,
    });

    const handleChange = (e) => {
        const { name, value, checked, type } =
            e.target;

        setFormData({
            ...formData,
            [name]:
                type === "checkbox"
                    ? checked
                    : value,
        });
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);

            const data = await loginAPI(formData);

            localStorage.setItem(
                "token",
                data.token
            );

            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            toast.success("Login successful");

            setTimeout(() => {
                navigate("/");
            }, 1000);

        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Login failed"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <ToastContainer />

            <div
                className="card p-4 shadow"
                style={{
                    width: "400px",
                    borderRadius: "20px",
                }}
            >
                <h2 className="text-center mb-4">
                    RoomHub Login
                </h2>

                <form onSubmit={handleLogin}>
                    <div className="mb-3">
                        <label className="form-label">
                            Username
                        </label>

                        <input
                            type="text"
                            className="form-control"
                            name="username"
                            placeholder="Enter username"
                            value={formData.username}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">
                            Password
                        </label>

                        <input
                            type="password"
                            className="form-control"
                            name="password"
                            placeholder="Enter password"
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-check mb-3">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            name="remember"
                            checked={formData.remember}
                            onChange={handleChange}
                        />

                        <label className="form-check-label">
                            Remember me
                        </label>
                    </div>

                    <div className="text-center mt-3">
                        Don't have account?

                        <Link
                            to="/register"
                            className="ms-2"
                        >
                            Register
                        </Link>
                    </div>

                    <button
                        className="btn btn-primary w-100"
                        disabled={loading}
                    >
                        {loading
                            ? "Loading..."
                            : "Login"}
                    </button>
                </form>
            </div>
        </>
    );
};

export default Login;