import { useState } from "react";
import { toast, ToastContainer } from "react-toastify";

import { changePasswordAPI } from "../../api/auth";

const ChangePassword = () => {
    const [formData, setFormData] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const [loading, setLoading] = useState(false);

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
                className="container d-flex justify-content-center align-items-center"
                style={{ minHeight: "100vh" }}
            >
                <div
                    className="card shadow p-4"
                    style={{ width: "450px" }}
                >
                    <h3 className="text-center mb-4">
                        Change Password
                    </h3>

                    <form
                        onSubmit={handleSubmit}
                    >
                        <div className="mb-3">
                            <label className="form-label">
                                Old Password
                            </label>

                            <input
                                type="password"
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
                        </div>

                        <div className="mb-3">
                            <label className="form-label">
                                New Password
                            </label>

                            <input
                                type="password"
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
                        </div>

                        <div className="mb-3">
                            <label className="form-label">
                                Confirm Password
                            </label>

                            <input
                                type="password"
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
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-100"
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