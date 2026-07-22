//test
import { useEffect, useState } from "react";
import {
    getProfileAPI,
    updateProfileAPI,
    sendOTPChangeEmailAPI,
    verifyChangeEmailAPI
} from "../../api/accountAPI";

import { User, Mail, Phone, Venus, Shield, Edit, Pencil } from "lucide-react";

import Header from "../layout/homepage/header";
import Footer from "../layout/homepage/footer";
import ProfileSidebar from "./ProfileSidebar";

import Swal from "sweetalert2";

const Profile = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [active, setActive] = useState("info");

    const [emailModal, setEmailModal] = useState(false);
    const [newEmail, setNewEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState(1);
    const [token, setToken] = useState("");

    const [emailMessage, setEmailMessage] = useState("");
    const [emailError, setEmailError] = useState("");
    const [verifyLoading, setVerifyLoading] = useState(false);
    const [sendLoading, setSendLoading] = useState(false);

    const [editOpen, setEditOpen] = useState(false);

    const [form, setForm] = useState({
        fullname: "",
        phoneNumber: "",
        gender: "",
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const data = await getProfileAPI();
            setUser(data);

            setForm({
                fullname: data.fullname || "",
                phoneNumber: data.phoneNumber || "",
                gender: data.gender || "",
            });
        } catch (error) {
            if (error?.response?.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.href = "/login";
                return;
            }

            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "error",
                title: "Load profile failed",
                showConfirmButton: false,
                timer: 2000,
            });
        } finally {
            setLoading(false);
        }
    };

    const hasChange =
        user &&
        (
            form.fullname !== user.fullname ||
            form.phoneNumber !== user.phoneNumber ||
            form.gender !== user.gender
        );

    const handleUpdate = async () => {
        if (!hasChange) {
            setEditOpen(false);

            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "info",
                title: "No changes detected",
                showConfirmButton: false,
                timer: 1500,
            });

            return;
        }

        try {
            await updateProfileAPI({
                fullname: form.fullname,
                phoneNumber: form.phoneNumber,
                gender: form.gender,
            });

            setEditOpen(false);
            fetchProfile();

            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: "Profile updated",
                showConfirmButton: false,
                timer: 1500,
            });

        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text: err.response?.data?.message || "Update failed",
            });
        }
    };

    const handleSendOTP = async () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!newEmail.trim()) {
            setEmailError("Please enter email");
            return;
        }

        if (!emailRegex.test(newEmail)) {
            setEmailError("Please enter a valid email address");
            return;
        }

        try {
            setSendLoading(true);
            setEmailError("");
            setEmailMessage("");

            const res = await sendOTPChangeEmailAPI(newEmail);

            setToken(res.token);
            setStep(2);

            setEmailMessage(
                `OTP has been sent to ${newEmail}. Please check your inbox and spam folder.`
            );

        } catch (err) {
            setEmailError(
                err.response?.data?.message || "Failed to send OTP"
            );
        } finally {
            setSendLoading(false);
        }
    };

    const handleVerifyEmail = async () => {
        if (!otp.trim()) {
            setEmailError("Please enter OTP");
            return;
        }

        try {
            setVerifyLoading(true);
            setEmailError("");

            await verifyChangeEmailAPI({
                email: newEmail,
                otp,
                token,
            });

            setEmailModal(false);

            setStep(1);
            setNewEmail("");
            setOtp("");
            setToken("");
            setEmailMessage("");
            setEmailError("");

            await fetchProfile();

            Swal.fire({
                icon: "success",
                title: "Email Updated",
                text: "Your email has been changed successfully.",
                confirmButtonColor: "#ff6b00",
            });

        } catch (err) {
            setEmailError(
                err.response?.data?.message || "Invalid OTP"
            );
        } finally {
            setVerifyLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    const inputStyle = {
        width: "100%",
        padding: "12px",
        borderRadius: "10px",
        border: "1px solid #e5e7eb",
        outline: "none",
        fontSize: "14px",
    };

    return (
        <>
            <Header />

            <div style={{
                minHeight: "100vh",
                background: "#f6f7f9",
                padding: "40px 20px",
            }}>
                <div style={{
                    maxWidth: "1100px",
                    margin: "0 auto",
                    display: "grid",
                    gridTemplateColumns: "300px 1fr",
                    gap: "20px",
                }}>

                    <ProfileSidebar
                        user={user}
                        active={active}
                        setActive={setActive}
                    />

                    <div style={{
                        background: "#fff",
                        borderRadius: "16px",
                        padding: "30px",
                    }}>
                        <h2>My Profile</h2>
                        <div style={{ marginTop: 20 }}>
                            <Info icon={<User />} label="Username" value={user?.username} />

                            <Info
                                icon={<Mail />}
                                label="Email"
                                value={
                                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                        <span>{user?.email}</span>

                                        <button
                                            onClick={() => setEmailModal(true)}
                                            style={{
                                                background: "transparent",
                                                border: "1px solid #eee",
                                                borderRadius: 6,
                                                padding: "4px 6px",
                                                cursor: "pointer",
                                            }}
                                        >
                                            <Pencil size={14} />
                                        </button>
                                    </div>
                                }
                            />

                            <Info icon={<Phone />} label="Phone" value={user?.phoneNumber} />
                            <Info icon={<Venus />} label="Gender" value={user?.gender} />
                            <Info icon={<Shield />} label="Role" value={user?.role} />
                        </div>

                        <button
                            onClick={() => setEditOpen(true)}
                            style={{
                                marginTop: 20,
                                width: "100%",
                                background: "#ff6b00",
                                color: "#fff",
                                padding: 12,
                                borderRadius: 10,
                                border: "none",
                                cursor: "pointer",
                            }}
                        >
                            <Edit size={16} /> Edit Profile
                        </button>
                    </div>
                </div>
            </div>

            {emailModal && (
                <div style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.5)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 9999,
                }}>
                    <div style={{
                        width: 400,
                        background: "#fff",
                        padding: 20,
                        borderRadius: 12,
                    }}>
                        <h3
                            style={{
                                marginBottom: 16,
                                textAlign: "center",
                            }}
                        >
                            Change Email
                        </h3>

                        {emailMessage && (
                            <div
                                style={{
                                    background: "#ecfdf5",
                                    color: "#059669",
                                    padding: 12,
                                    borderRadius: 8,
                                    marginBottom: 12,
                                    fontSize: 14,
                                    border: "1px solid #a7f3d0",
                                }}
                            >
                                {emailMessage}
                            </div>
                        )}

                        {emailError && (
                            <div
                                style={{
                                    background: "#fef2f2",
                                    color: "#dc2626",
                                    padding: 12,
                                    borderRadius: 8,
                                    marginBottom: 12,
                                    fontSize: 14,
                                    border: "1px solid #fecaca",
                                }}
                            >
                                {emailError}
                            </div>
                        )}

                        {step === 1 && (
                            <>
                                <input
                                    placeholder="New email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    style={inputStyle}
                                />

                                <button
                                    onClick={handleSendOTP}
                                    disabled={sendLoading}
                                    style={{
                                        marginTop: 10,
                                        width: "100%",
                                        background: "#ff6b00",
                                        color: "#fff",
                                        padding: 10,
                                        border: "none",
                                        borderRadius: 8,
                                        cursor: sendLoading ? "not-allowed" : "pointer",
                                        opacity: sendLoading ? 0.7 : 1,
                                    }}
                                >
                                    {sendLoading ? "Sending..." : "Send OTP"}
                                </button>
                            </>
                        )}

                        {step === 2 && (
                            <>
                                <input
                                    placeholder="Enter OTP"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    style={inputStyle}
                                />

                                <button
                                    onClick={handleVerifyEmail}
                                    disabled={verifyLoading}
                                    style={{
                                        marginTop: 10,
                                        width: "100%",
                                        background: "#ff6b00",
                                        color: "#fff",
                                        padding: 10,
                                        border: "none",
                                        borderRadius: 8,
                                        cursor: verifyLoading ? "not-allowed" : "pointer",
                                        opacity: verifyLoading ? 0.7 : 1,
                                    }}
                                >
                                    {verifyLoading ? "Verifying..." : "Verify OTP"}
                                </button>
                            </>
                        )}

                        <button
                            onClick={() => {
                                setEmailModal(false);
                                setStep(1);
                                setNewEmail("");
                                setOtp("");
                                setToken("");
                                setEmailMessage("");
                                setEmailError("");
                            }}
                            style={{
                                marginTop: 10,
                                width: "100%",
                                background: "#ccc",
                                border: "none",
                                padding: 10,
                                borderRadius: 8,
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {editOpen && (
                <div style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.5)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 9999,
                }}>
                    <div style={{
                        width: 420,
                        background: "#fff",
                        borderRadius: 16,
                        padding: 24,
                    }}>
                        <h3>Edit Profile</h3>

                        <input
                            placeholder="Full name"
                            value={form.fullname}
                            onChange={(e) => setForm({ ...form, fullname: e.target.value })}
                            style={inputStyle}
                        />

                        <input
                            placeholder="Phone number"
                            value={form.phoneNumber}
                            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                            style={{ ...inputStyle, marginTop: 10 }}
                        />

                        <select
                            value={form.gender}
                            onChange={(e) => setForm({ ...form, gender: e.target.value })}
                            style={{ ...inputStyle, marginTop: 10 }}
                        >
                            <option value="">Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>

                        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                            <button
                                onClick={handleUpdate}
                                disabled={!hasChange}
                                style={{
                                    flex: 1,
                                    background: hasChange ? "#ff6b00" : "#ccc",
                                    color: "#fff",
                                    padding: 12,
                                    borderRadius: 10,
                                    border: "none",
                                    cursor: hasChange ? "pointer" : "not-allowed",
                                }}
                            >
                                Save
                            </button>

                            <button
                                onClick={() => setEditOpen(false)}
                                style={{
                                    flex: 1,
                                    background: "#eee",
                                    border: "none",
                                    borderRadius: 10,
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </>
    );
};

const Info = ({ icon, label, value }) => (
    <div style={{
        display: "flex",
        justifyContent: "space-between",
        padding: 10,
        background: "#f8fafc",
        marginBottom: 8,
        borderRadius: 8,
    }}>
        <span>{icon} {label}</span>
        <b>{value || "N/A"}</b>
    </div>
);

export default Profile;