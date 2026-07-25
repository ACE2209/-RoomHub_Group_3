import { useEffect, useState, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  Venus,
  Shield,
  Edit,
  Pencil,
  Camera,
} from "lucide-react";
import Swal from "sweetalert2";
import { getUser } from "../../../api/authAPI";
import {
  updateAccountFromProfile,
  updateAvatar,
  sendOTPChangeEmailAPI,
  verifyChangeEmailAPI,
} from "../../../api/accountAPI";

/* ─── helpers ─── */
const roleLabel = (role) => {
  const map = { admin: "Admin", owner: "Owner", staff: "Staff", user: "User" };
  return map[role] || role;
};

const roleBadgeStyle = (role) => {
  const colors = {
    admin: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
    owner: { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
    staff: { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
    user: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  };
  const c = colors[role] || colors.user;
  return {
    display: "inline-block",
    padding: "2px 12px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    background: c.bg,
    color: c.color,
    border: `1px solid ${c.border}`,
  };
};

/* ─── Info row ─── */
const Info = ({ icon, label, value }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 16,
      padding: "12px 14px",
      background: "#f8fafc",
      marginBottom: 8,
      borderRadius: 10,
    }}
  >
    <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#555", fontWeight: 500 }}>
      {icon}
      {label}
    </span>
    <div style={{ fontWeight: 700, textAlign: "right", wordBreak: "break-word", color: "#111" }}>
      {value || "N/A"}
    </div>
  </div>
);

/* ─── Input style ─── */
const inputStyle = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  outline: "none",
  fontSize: 14,
  boxSizing: "border-box",
  color: "#111",
};

/* ════════════════════════════════════════════ */
function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* edit modal */
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ fullname: "", phoneNumber: "", gender: "" });

  /* change email modal */
  const [emailModal, setEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [token, setToken] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailError, setEmailError] = useState("");
  const [sendLoading, setSendLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  /* avatar */
  const fileRef = useRef(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

  /* ── fetch ── */
  const fetchProfile = async () => {
    try {
      const data = await getUser();
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
window.location.replace("/");        return;
      }
      Swal.fire({ icon: "error", title: "Error", text: error?.response?.data?.message || "Unable to load profile" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  /* ── hasChange ── */
  const hasChange =
    user &&
    (form.fullname !== (user.fullname || "") ||
      form.phoneNumber !== (user.phoneNumber || "") ||
      form.gender !== (user.gender || ""));

  /* ── update profile ── */
  const handleUpdate = async () => {
    if (!hasChange) {
      setEditOpen(false);
      Swal.fire({ toast: true, position: "top-end", icon: "info", title: "No changes detected", showConfirmButton: false, timer: 1500 });
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
      await updateAccountFromProfile({ fullname: form.fullname, phoneNumber: form.phoneNumber, gender: form.gender });
      setEditOpen(false);
      await fetchProfile();
      Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Profile updated", showConfirmButton: false, timer: 1500 });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: error?.response?.data?.message || "Update failed" });
    }
  };

  /* ── avatar upload ── */
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if (!isJpgOrPng) { Swal.fire({ icon: "warning", title: "Only JPG/PNG allowed" }); return; }
    if (file.size / 1024 / 1024 > 2) { Swal.fire({ icon: "warning", title: "Image must be < 2MB" }); return; }

    setAvatarLoading(true);
    const formData = new FormData();
    formData.append("avatar", file);
    try {
      await updateAvatar(formData);
      await fetchProfile();
      Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Avatar updated", showConfirmButton: false, timer: 1500 });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Upload failed", text: error?.response?.data?.message });
    } finally {
      setAvatarLoading(false);
    }
  };

  /* ── change email ── */
  const handleSendOTP = async () => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const trimmed = newEmail.trim();
    if (!trimmed) { setEmailError("Please enter email"); return; }
    if (!emailRegex.test(trimmed)) {
      Swal.fire({
        icon: "error",
        title: "Invalid Email Format",
        text: "Please enter a valid email address (e.g. example@domain.com).",
      });
      setEmailError("Please enter a valid email address");
      return;
    }
    if (trimmed.toLowerCase() === user?.email?.toLowerCase()) { setEmailError("New email must be different from current email"); return; }
    try {
      setSendLoading(true);
      setEmailError(""); setEmailMessage("");
      const response = await sendOTPChangeEmailAPI(trimmed);
      setToken(response.token);
      setNewEmail(trimmed);
      setStep(2);
      setEmailMessage(`OTP has been sent to ${trimmed}. Please check your inbox.`);
    } catch (error) {
      setEmailError(error?.response?.data?.message || "Failed to send OTP");
    } finally { setSendLoading(false); }
  };

  const handleVerifyEmail = async () => {
    const trimmedOtp = otp.trim();
    if (!trimmedOtp) { setEmailError("Please enter OTP"); return; }
    try {
      setVerifyLoading(true); setEmailError("");
      await verifyChangeEmailAPI({ email: newEmail, otp: trimmedOtp, token });
      closeEmailModal();
      await fetchProfile();
      Swal.fire({ icon: "success", title: "Email Updated", text: "Your email has been changed successfully.", confirmButtonColor: "#ff6b00" });
    } catch (error) {
      setEmailError(error?.response?.data?.message || "Invalid OTP");
    } finally { setVerifyLoading(false); }
  };

  /* ── modal helpers ── */
  const openEditModal = () => {
    setForm({ fullname: user?.fullname || "", phoneNumber: user?.phoneNumber || "", gender: user?.gender || "" });
    setEditOpen(true);
  };
  const closeEditModal = () => {
    setForm({ fullname: user?.fullname || "", phoneNumber: user?.phoneNumber || "", gender: user?.gender || "" });
    setEditOpen(false);
  };
  const openEmailModal = () => {
    setNewEmail(""); setOtp(""); setToken(""); setStep(1); setEmailMessage(""); setEmailError("");
    setEmailModal(true);
  };
  const closeEmailModal = () => {
    setEmailModal(false); setStep(1); setNewEmail(""); setOtp(""); setToken("");
    setEmailMessage(""); setEmailError(""); setSendLoading(false); setVerifyLoading(false);
  };

  /* ── loading state ── */
  if (loading) {
    return (
      <div style={{ minHeight: "70vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ fontSize: 16, color: "#888" }}>Loading...</div>
      </div>
    );
  }

  const avatarUrl =
    user?.avatarImage?.url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullname || "User")}&background=ff6b00&color=fff&size=200`;

  /* ════════════════ RENDER ════════════════ */
  return (
    <div style={{ minHeight: "100vh", background: "#f6f7f9", padding: "32px 20px" }}>
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "280px 1fr",
          gap: 20,
        }}
      >
        {/* ── Sidebar ── */}
        <aside
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 24,
            border: "1px solid #eee",
            boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
            position: "sticky",
            top: 20,
            height: "fit-content",
          }}
        >
          {/* Avatar */}
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ position: "relative", width: 120, height: 120 }}>
              <img
                src={avatarUrl}
                alt={user?.fullname || "User"}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "4px solid #ff6b00",
                  display: "block",
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={avatarLoading}
                style={{
                  position: "absolute",
                  bottom: 4,
                  right: 4,
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: "#ff6b00",
                  border: "2px solid #fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: avatarLoading ? "not-allowed" : "pointer",
                  opacity: avatarLoading ? 0.6 : 1,
                }}
              >
                <Camera size={14} color="#fff" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png"
                style={{ display: "none" }}
                onChange={handleAvatarChange}
              />
            </div>
          </div>

          {/* Name & username */}
          <div style={{ textAlign: "center", marginTop: 14 }}>
            <h2 style={{ margin: "0 0 4px", fontWeight: 700, color: "#222", fontSize: 18 }}>
              {user?.fullname || "User"}
            </h2>
            <p style={{ margin: 0, color: "#888", fontSize: 13 }}>@{user?.username || "user"}</p>
            <div style={{ marginTop: 10 }}>
              <span style={roleBadgeStyle(user?.role)}>{roleLabel(user?.role)}</span>
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: "1px solid #f0f0f0", margin: "20px 0" }} />

          {/* Quick info */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#555" }}>
              <Mail size={14} color="#ff6b00" />
              <span style={{ wordBreak: "break-all" }}>{user?.email || "N/A"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#555" }}>
              <Phone size={14} color="#ff6b00" />
              <span>{user?.phoneNumber || "N/A"}</span>
            </div>
          </div>
        </aside>

        {/* ── Main content ── */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 32,
            border: "1px solid #eee",
            boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
          }}
        >
          <h2 style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 22, color: "#111" }}>
            My Profile
          </h2>
          <p style={{ margin: "0 0 24px", color: "#888", fontSize: 14 }}>
            Manage your personal information
          </p>

          {/* Info rows */}
          <div>
            <Info icon={<User size={17} />} label="Username" value={user?.username} />
            <Info
              icon={<Mail size={17} />}
              label="Email"
              value={
                <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "flex-end" }}>
                  <span>{user?.email || "N/A"}</span>
                  <button
                    type="button"
                    onClick={openEmailModal}
                    aria-label="Change email"
                    style={{
                      background: "transparent",
                      border: "1px solid #e5e7eb",
                      borderRadius: 6,
                      padding: "3px 6px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Pencil size={13} />
                  </button>
                </div>
              }
            />
            <Info icon={<Phone size={17} />} label="Phone" value={user?.phoneNumber} />
            <Info icon={<Venus size={17} />} label="Gender" value={user?.gender} />
            <Info icon={<Shield size={17} />} label="Role"
              value={<span style={roleBadgeStyle(user?.role)}>{roleLabel(user?.role)}</span>}
            />
          </div>

          {/* Edit button */}
          <button
            type="button"
            onClick={openEditModal}
            style={{
              marginTop: 24,
              width: "100%",
              background: "#ff6b00",
              color: "#fff",
              padding: "12px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
              fontWeight: 600,
              fontSize: 15,
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = 0.88)}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = 1)}
          >
            <Edit size={16} />
            Edit Profile
          </button>
        </div>
      </div>

      {/* ── Change Email Modal ── */}
      {emailModal && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.48)",
            display: "flex", justifyContent: "center", alignItems: "center",
            zIndex: 1000, padding: 20,
          }}
        >
          <div style={{ width: "100%", maxWidth: 400, background: "#fff", padding: 28, borderRadius: 16 }}>
            <h3 style={{ margin: "0 0 16px", textAlign: "center", fontSize: 18, fontWeight: 700 }}>
              Change Email
            </h3>

            {emailMessage && (
              <div style={{ background: "#ecfdf5", color: "#059669", padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 13, border: "1px solid #a7f3d0" }}>
                {emailMessage}
              </div>
            )}
            {emailError && (
              <div style={{ background: "#fef2f2", color: "#dc2626", padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 13, border: "1px solid #fecaca" }}>
                {emailError}
              </div>
            )}

            {step === 1 && (
              <>
                <input
                  type="email"
                  placeholder="New email address"
                  value={newEmail}
                  disabled={sendLoading}
                  onChange={(e) => { setNewEmail(e.target.value); setEmailError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={sendLoading}
                  style={{ marginTop: 10, width: "100%", background: "#ff6b00", color: "#fff", padding: 11, border: "none", borderRadius: 8, cursor: sendLoading ? "not-allowed" : "pointer", opacity: sendLoading ? 0.7 : 1, fontWeight: 600 }}
                >
                  {sendLoading ? "Sending..." : "Send OTP"}
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
                  onChange={(e) => { setOtp(e.target.value); setEmailError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyEmail()}
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={handleVerifyEmail}
                  disabled={verifyLoading}
                  style={{ marginTop: 10, width: "100%", background: "#ff6b00", color: "#fff", padding: 11, border: "none", borderRadius: 8, cursor: verifyLoading ? "not-allowed" : "pointer", opacity: verifyLoading ? 0.7 : 1, fontWeight: 600 }}
                >
                  {verifyLoading ? "Verifying..." : "Verify OTP"}
                </button>
                <button
                  type="button"
                  onClick={() => { setStep(1); setOtp(""); setToken(""); setEmailMessage(""); setEmailError(""); }}
                  disabled={verifyLoading}
                  style={{ marginTop: 8, width: "100%", background: "#f3f4f6", color: "#111827", padding: 11, border: "none", borderRadius: 8, cursor: verifyLoading ? "not-allowed" : "pointer" }}
                >
                  Change email address
                </button>
              </>
            )}

            <button
              type="button"
              onClick={closeEmailModal}
              disabled={sendLoading || verifyLoading}
              style={{ marginTop: 8, width: "100%", background: "#e5e7eb", border: "none", padding: 11, borderRadius: 8, cursor: (sendLoading || verifyLoading) ? "not-allowed" : "pointer", color: "#374151" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Edit Profile Modal ── */}
      {editOpen && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.48)",
            display: "flex", justifyContent: "center", alignItems: "center",
            zIndex: 1000, padding: 20,
          }}
        >
          <div style={{ width: "100%", maxWidth: 440, background: "#fff", borderRadius: 16, padding: 28 }}>
            <h3 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700 }}>Edit Profile</h3>

            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 4 }}>Full Name</label>
            <input
              type="text"
              placeholder="Full name"
              value={form.fullname}
              onChange={(e) => setForm({ ...form, fullname: e.target.value })}
              style={inputStyle}
            />

            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#555", margin: "14px 0 4px" }}>Phone Number</label>
            <input
              type="tel"
              placeholder="Phone number"
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
              style={inputStyle}
            />

            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#555", margin: "14px 0 4px" }}>Gender</label>
            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              style={{ ...inputStyle, color: form.gender ? "#111" : "#888" }}
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>

            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button
                type="button"
                onClick={handleUpdate}
                disabled={!hasChange}
                style={{
                  flex: 1, background: hasChange ? "#ff6b00" : "#d1d5db",
                  color: "#fff", padding: 12, borderRadius: 10, border: "none",
                  cursor: hasChange ? "pointer" : "not-allowed", fontWeight: 600,
                }}
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={closeEditModal}
                style={{ flex: 1, background: "#f3f4f6", border: "none", borderRadius: 10, cursor: "pointer", fontWeight: 600, color: "#374151" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
