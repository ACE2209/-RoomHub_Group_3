//test
import { useEffect, useState } from "react";
import {
    getProfileAPI,
    updateProfileAPI,
    sendOTPChangeEmailAPI,
    verifyChangeEmailAPI
} from "../../api/accountAPI";

import {
    User,
    Mail,
    Phone,
    Venus,
    Shield,
    Edit,
    Pencil
} from "lucide-react";

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
    const [phoneError, setPhoneError] = useState("");

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

                if (window.location.pathname !== "/login") {
                    window.location.replace("/login");
                }

                return;
            }

            Swal.fire({
                icon: "error",
                title: "Error",
                text:
                    error?.response?.data?.message ||
                    "Unable to load profile",
            });
        } finally {
            setLoading(false);
        }
    };

    const hasChange =
        user &&
        (
            form.fullname !== (user.fullname || "") ||
            form.phoneNumber !== (user.phoneNumber || "") ||
            form.gender !== (user.gender || "")
        );

    const isValidPhone = (value) => /^0[1-9]\d{8,9}$/.test(value) && value.length >= 10 && value.length <= 11;

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

        const phoneRegex = /^(0)[0-9]{9}$/;
        const uniqueDigits = new Set(form.phoneNumber?.split('') || []).size;
        const isConsecutive = form.phoneNumber === "0123456789" || form.phoneNumber === "0987654321";

        if (form.phoneNumber && (!phoneRegex.test(form.phoneNumber) || uniqueDigits <= 2 || isConsecutive)) {
            Swal.fire({
                icon: "error",
                title: "Invalid Phone Format",
                text: "Please enter a real 10-digit phone number. Fake sequences are not allowed.",
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

            await fetchProfile();

            Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: "Profile updated",
                showConfirmButton: false,
                timer: 1500,
            });
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Error",
                text:
                    error?.response?.data?.message ||
                    "Update failed",
            });
        }
    };

    const handleSendOTP = async () => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        const trimmedEmail = newEmail.trim();

        if (!trimmedEmail) {
            setEmailError("Please enter email");
            return;
        }

        if (!emailRegex.test(trimmedEmail)) {
            Swal.fire({
                icon: "error",
                title: "Invalid Email Format",
                text: "Please enter a valid email address (e.g. example@domain.com).",
            });
            setEmailError("Please enter a valid email address");
            return;
        }

        if (
            user?.email &&
            trimmedEmail.toLowerCase() === user.email.toLowerCase()
        ) {
            setEmailError(
                "New email must be different from your current email"
            );
            return;
        }

        try {
            setSendLoading(true);
            setEmailError("");
            setEmailMessage("");

            const response = await sendOTPChangeEmailAPI(trimmedEmail);

            setToken(response.token);
            setNewEmail(trimmedEmail);
            setStep(2);

            setEmailMessage(
                `OTP has been sent to ${trimmedEmail}. Please check your inbox and spam folder.`
            );
        } catch (error) {
            setEmailError(
                error?.response?.data?.message ||
                "Failed to send OTP"
            );
        } finally {
            setSendLoading(false);
        }
    };

    const handleVerifyEmail = async () => {
        const trimmedOtp = otp.trim();

        if (!trimmedOtp) {
            setEmailError("Please enter OTP");
            return;
        }

        try {
            setVerifyLoading(true);
            setEmailError("");

            await verifyChangeEmailAPI({
                email: newEmail,
                otp: trimmedOtp,
                token,
            });

            closeEmailModal();

            await fetchProfile();

            Swal.fire({
                icon: "success",
                title: "Email Updated",
                text: "Your email has been changed successfully.",
                confirmButtonColor: "#ff6b00",
            });
        } catch (error) {
            setEmailError(
                error?.response?.data?.message ||
                "Invalid OTP"
            );
        } finally {
            setVerifyLoading(false);
        }
    };

    const openEditModal = () => {
        setForm({
            fullname: user?.fullname || "",
            phoneNumber: user?.phoneNumber || "",
            gender: user?.gender || "",
        });

        setEditOpen(true);
    };

    const closeEditModal = () => {
        setForm({
            fullname: user?.fullname || "",
            phoneNumber: user?.phoneNumber || "",
            gender: user?.gender || "",
        });

        setEditOpen(false);
    };

    const openEmailModal = () => {
        setNewEmail("");
        setOtp("");
        setToken("");
        setStep(1);
        setEmailMessage("");
        setEmailError("");
        setEmailModal(true);
    };

    const closeEmailModal = () => {
        setEmailModal(false);
        setStep(1);
        setNewEmail("");
        setOtp("");
        setToken("");
        setEmailMessage("");
        setEmailError("");
        setSendLoading(false);
        setVerifyLoading(false);
    };

    if (loading) {
        return (
            <>
                <Header />

                <div
                    style={{
                        minHeight: "70vh",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                    }}
                >
                    Loading...
                </div>

                <Footer />
            </>
        );
    }

    const inputStyle = {
        width: "100%",
        padding: "12px",
        borderRadius: "10px",
        border: "1px solid #e5e7eb",
        outline: "none",
        fontSize: "14px",
        boxSizing: "border-box",
    };

    return (
        <>
            <Header />

            <div
                style={{
                    minHeight: "100vh",
                    background: "#f6f7f9",
                    padding: "40px 20px",
                }}
            >
                <div
                    style={{
                        maxWidth: "1100px",
                        margin: "0 auto",
                        display: "grid",
                        gridTemplateColumns: "300px 1fr",
                        gap: "20px",
                    }}
                >
                    <ProfileSidebar
                        user={user}
                        active={active}
                        setActive={setActive}
                        fetchProfile={fetchProfile}
                    />

                    <div
                        style={{
                            background: "#fff",
                            borderRadius: "16px",
                            padding: "30px",
                        }}
                    >
                        <h2>My Profile</h2>

                        <div style={{ marginTop: 20 }}>
                            <Info
                                icon={<User size={18} />}
                                label="Username"
                                value={user?.username}
                            />

                            <Info
                                icon={<Mail size={18} />}
                                label="Email"
                                value={
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 8,
                                            alignItems: "center",
                                        }}
                                    >
                                        <span>{user?.email || "N/A"}</span>

                                        <button
                                            type="button"
                                            onClick={openEmailModal}
                                            aria-label="Change email"
                                            style={{
                                                background: "transparent",
                                                border: "1px solid #eee",
                                                borderRadius: 6,
                                                padding: "4px 6px",
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            <Pencil size={14} />
                                        </button>
                                    </div>
                                }
                            />

                            <Info
                                icon={<Phone size={18} />}
                                label="Phone"
                                value={user?.phoneNumber}
                            />

                            <Info
                                icon={<Venus size={18} />}
                                label="Gender"
                                value={user?.gender}
                            />

                            <Info
                                icon={<Shield size={18} />}
                                label="Role"
                                value={user?.role}
                            />
                        </div>

                        <button
                            type="button"
                            onClick={openEditModal}
                            style={{
                                marginTop: 20,
                                width: "100%",
                                background: "#ff6b00",
                                color: "#fff",
                                padding: 12,
                                borderRadius: 10,
                                border: "none",
                                cursor: "pointer",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                gap: 8,
                            }}
                        >
                            <Edit size={16} />
                            Edit Profile
                        </button>
                    </div>
                </div>
            </div>

            {emailModal && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.5)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 1000,
                        padding: 20,
                    }}
                >
                    <div
                        style={{
                            width: "100%",
                            maxWidth: 400,
                            background: "#fff",
                            padding: 20,
                            borderRadius: 12,
                        }}
                    >
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
                                    type="email"
                                    placeholder="New email"
                                    value={newEmail}
                                    disabled={sendLoading}
                                    onChange={(event) => {
                                        setNewEmail(event.target.value);
                                        setEmailError("");
                                    }}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                            handleSendOTP();
                                        }
                                    }}
                                    style={inputStyle}
                                />

                                <button
                                    type="button"
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
                                        cursor: sendLoading
                                            ? "not-allowed"
                                            : "pointer",
                                        opacity: sendLoading ? 0.7 : 1,
                                    }}
                                >
                                    {sendLoading
                                        ? "Sending..."
                                        : "Send OTP"}
                                </button>
                            </>
                        )}

                        {step === 2 && (
                            <>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="Enter OTP"
                                    value={otp}
                                    disabled={verifyLoading}
                                    onChange={(event) => {
                                        setOtp(event.target.value);
                                        setEmailError("");
                                    }}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                            handleVerifyEmail();
                                        }
                                    }}
                                    style={inputStyle}
                                />

                                <button
                                    type="button"
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
                                        cursor: verifyLoading
                                            ? "not-allowed"
                                            : "pointer",
                                        opacity: verifyLoading ? 0.7 : 1,
                                    }}
                                >
                                    {verifyLoading
                                        ? "Verifying..."
                                        : "Verify OTP"}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep(1);
                                        setOtp("");
                                        setToken("");
                                        setEmailMessage("");
                                        setEmailError("");
                                    }}
                                    disabled={verifyLoading}
                                    style={{
                                        marginTop: 10,
                                        width: "100%",
                                        background: "#f3f4f6",
                                        color: "#111827",
                                        padding: 10,
                                        border: "none",
                                        borderRadius: 8,
                                        cursor: verifyLoading
                                            ? "not-allowed"
                                            : "pointer",
                                    }}
                                >
                                    Change email address
                                </button>
                            </>
                        )}

                        <button
                            type="button"
                            onClick={closeEmailModal}
                            disabled={sendLoading || verifyLoading}
                            style={{
                                marginTop: 10,
                                width: "100%",
                                background: "#ccc",
                                border: "none",
                                padding: 10,
                                borderRadius: 8,
                                cursor:
                                    sendLoading || verifyLoading
                                        ? "not-allowed"
                                        : "pointer",
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {editOpen && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(0,0,0,0.5)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 1000,
                        padding: 20,
                    }}
                >
                    <div
                        style={{
                            width: "100%",
                            maxWidth: 420,
                            background: "#fff",
                            borderRadius: 16,
                            padding: 24,
                        }}
                    >
                        <h3>Edit Profile</h3>

                        <input
                            type="text"
                            placeholder="Full name"
                            value={form.fullname}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    fullname: event.target.value,
                                })
                            }
                            style={inputStyle}
                        />

                        <input
                            type="tel"
                            placeholder="Phone number"
                            value={form.phoneNumber}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    phoneNumber: event.target.value,
                                })
                            }
                            style={{
                                ...inputStyle,
                                marginTop: 10,
                            }}
                        />

                        <select
                            value={form.gender}
                            onChange={(event) =>
                                setForm({
                                    ...form,
                                    gender: event.target.value,
                                })
                            }
                            style={{
                                ...inputStyle,
                                marginTop: 10,
                            }}
                        >
                            <option value="">Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>

                        <div
                            style={{
                                display: "flex",
                                gap: 10,
                                marginTop: 20,
                            }}
                        >
                            <button
                                type="button"
                                onClick={handleUpdate}
                                disabled={!hasChange}
                                style={{
                                    flex: 1,
                                    background: hasChange
                                        ? "#ff6b00"
                                        : "#ccc",
                                    color: "#fff",
                                    padding: 12,
                                    borderRadius: 10,
                                    border: "none",
                                    cursor: hasChange
                                        ? "pointer"
                                        : "not-allowed",
                                }}
                            >
                                Save
                            </button>

                            <button
                                type="button"
                                onClick={closeEditModal}
                                style={{
                                    flex: 1,
                                    background: "#eee",
                                    border: "none",
                                    borderRadius: 10,
                                    cursor: "pointer",
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
    <div
        style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            padding: 10,
            background: "#f8fafc",
            marginBottom: 8,
            borderRadius: 8,
        }}
    >
        <span
            style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
            }}
        >
            {icon}
            {label}
        </span>

        <div
            style={{
                fontWeight: 700,
                textAlign: "right",
                wordBreak: "break-word",
            }}
        >
            {value || "N/A"}
        </div>
    </div>
);

export default Profile;