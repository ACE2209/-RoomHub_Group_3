import { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { Lock, Eye, EyeOff } from "lucide-react";

import { changePasswordAPI } from "../../api/auth";
import { useNavigate } from "react-router-dom";

const ChangePassword = () => {
    const [loading, setLoading] = useState(false);
    const Navigate = useNavigate();
    const [showOldPassword, setShowOldPassword] =
        useState(false);
    const [showNewPassword, setShowNewPassword] =
        useState(false);
    const [
        showConfirmPassword,
        setShowConfirmPassword,
    ] = useState(false);

    const [formData, setFormData] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (
            formData.newPassword !==
            formData.confirmPassword
        ) {
            toast.error(
                "Confirm password does not match"
            );
            return;
        }

        try {
            setLoading(true);

            const res =
                await changePasswordAPI({
                    oldPassword:
                        formData.oldPassword,
                    newPassword:
                        formData.newPassword,
                });

            toast.success(
                res.message ||
                "Password changed successfully"
            );

            setFormData({
                oldPassword: "",
                newPassword: "",
                confirmPassword: "",
            });

            localStorage.removeItem("token");
            localStorage.removeItem("user");

            setTimeout(() => {
                Navigate("/login");
            }, 1500);
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Change password failed"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <ToastContainer />

            <div
                className="bg-light d-flex justify-content-center align-items-center"
                style={{ minHeight: "100vh" }}
            >
                <div
                    className="bg-white shadow-lg p-4 p-md-5 rounded-4"
                    style={{
                        width: "100%",
                        maxWidth: "500px",
                    }}
                >
                    <div className="mb-4">
                        <h2 className="fw-bold">
                            Change Password
                        </h2>

                        <p className="text-muted mb-0">
                            Update your account password
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Old Password */}
                        <div className="mb-3">
                            <label className="form-label">
                                Old Password
                            </label>

                            <div className="input-group">
                                <span className="input-group-text">
                                    <Lock size={18} />
                                </span>

                                <input
                                    type={
                                        showOldPassword
                                            ? "text"
                                            : "password"
                                    }
                                    className="form-control"
                                    name="oldPassword"
                                    value={
                                        formData.oldPassword
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />

                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() =>
                                        setShowOldPassword(
                                            !showOldPassword
                                        )
                                    }
                                >
                                    {showOldPassword ? (
                                        <EyeOff size={18} />
                                    ) : (
                                        <Eye size={18} />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* New Password */}
                        <div className="mb-3">
                            <label className="form-label">
                                New Password
                            </label>

                            <div className="input-group">
                                <span className="input-group-text">
                                    <Lock size={18} />
                                </span>

                                <input
                                    type={
                                        showNewPassword
                                            ? "text"
                                            : "password"
                                    }
                                    className="form-control"
                                    name="newPassword"
                                    value={
                                        formData.newPassword
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />

                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() =>
                                        setShowNewPassword(
                                            !showNewPassword
                                        )
                                    }
                                >
                                    {showNewPassword ? (
                                        <EyeOff size={18} />
                                    ) : (
                                        <Eye size={18} />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="mb-4">
                            <label className="form-label">
                                Confirm Password
                            </label>

                            <div className="input-group">
                                <span className="input-group-text">
                                    <Lock size={18} />
                                </span>

                                <input
                                    type={
                                        showConfirmPassword
                                            ? "text"
                                            : "password"
                                    }
                                    className="form-control"
                                    name="confirmPassword"
                                    value={
                                        formData.confirmPassword
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                />

                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() =>
                                        setShowConfirmPassword(
                                            !showConfirmPassword
                                        )
                                    }
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff size={18} />
                                    ) : (
                                        <Eye size={18} />
                                    )}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn w-100 py-2 text-white"
                            style={{
                                backgroundColor:
                                    "rgb(255, 107, 0)",
                                borderColor:
                                    "rgb(255, 107, 0)",
                            }}
                            disabled={loading}
                        >
                            {loading
                                ? "Changing..."
                                : "Change Password"}
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default ChangePassword;