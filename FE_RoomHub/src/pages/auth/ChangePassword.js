import { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import { Eye, EyeOff } from "lucide-react";
import { changePasswordAPI } from "../../api/auth";
import { useNavigate } from "react-router-dom";

import Header from "../layout/homepage/header";
import Footer from "../layout/homepage/footer";
import ProfileSidebar from "../profile/ProfileSidebar";
import { getProfileAPI } from "../../api/accountAPI";

const ChangePassword = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [active] = useState("security");

    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [formData, setFormData] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    useEffect(() => {
        (async () => {
            try {
                const data = await getProfileAPI();
                setUser(data);
            } catch (err) {
                console.log(err);
            }
        })();
    }, []);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.newPassword !== formData.confirmPassword) {
            toast.error("Confirm password does not match");
            return;
        }

        try {
            setLoading(true);

            const res = await changePasswordAPI({
                oldPassword: formData.oldPassword,
                newPassword: formData.newPassword,
            });

            toast.success(res.message || "Password changed successfully");

            setFormData({
                oldPassword: "",
                newPassword: "",
                confirmPassword: "",
            });

            localStorage.removeItem("token");
            localStorage.removeItem("user");

            setTimeout(() => navigate("/login"), 1200);
        } catch (error) {
            toast.error(error.response?.data?.message || "Change password failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Header />
            <ToastContainer />

            <div style={{ minHeight: "100vh", background: "#f6f7f9", padding: "40px 20px" }}>

                {/* GRID LAYOUT */}
                <div
                    style={{
                        maxWidth: "1200px",
                        margin: "0 auto",
                        display: "flex",
                        gap: "24px",
                        alignItems: "flex-start",
                    }}
                >

                    {/* SIDEBAR */}
                    <ProfileSidebar user={user} active={active} />

                    {/* CONTENT */}
                    <div
                        style={{
                            flex: 1,
                            background: "#fff",
                            borderRadius: "16px",
                            padding: "30px",
                            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
                        }}
                    >
                        <h2 style={{ fontWeight: 800, marginBottom: 20 }}>
                            Change Password
                        </h2>

                        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>

                            {/* OLD */}
                            <InputPassword
                                label="Old Password"
                                name="oldPassword"
                                value={formData.oldPassword}
                                onChange={handleChange}
                                show={showOldPassword}
                                setShow={setShowOldPassword}
                            />

                            {/* NEW */}
                            <InputPassword
                                label="New Password"
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleChange}
                                show={showNewPassword}
                                setShow={setShowNewPassword}
                            />

                            {/* CONFIRM */}
                            <InputPassword
                                label="Confirm Password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                show={showConfirmPassword}
                                setShow={setShowConfirmPassword}
                            />

                            {/* BUTTON */}
                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    marginTop: 10,
                                    padding: "12px",
                                    borderRadius: 10,
                                    background: "#ff6b00",
                                    color: "#fff",
                                    fontWeight: 700,
                                    border: "none",
                                    cursor: "pointer",
                                }}
                            >
                                {loading ? "Changing..." : "Change Password"}
                            </button>

                        </form>
                    </div>
                </div>
            </div>

            <Footer />
        </>
    );
};

const InputPassword = ({ label, name, value, onChange, show, setShow }) => (
    <div>
        <label style={{ fontWeight: 600 }}>{label}</label>

        <div style={{ display: "flex", marginTop: 6 }}>
            <input
                type={show ? "text" : "password"}
                name={name}
                value={value}
                onChange={onChange}
                style={{
                    flex: 1,
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "10px 0 0 10px",
                    outline: "none",
                }}
            />

            <button
                type="button"
                onClick={() => setShow(!show)}
                style={{
                    padding: "0 12px",
                    border: "1px solid #ddd",
                    borderLeft: "none",
                    background: "#f5f5f5",
                    borderRadius: "0 10px 10px 0",
                    cursor: "pointer",
                }}
            >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
        </div>
    </div>
);

export default ChangePassword;