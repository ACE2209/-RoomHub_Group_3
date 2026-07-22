import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Mail, Phone, User, Venus, Shield, Edit, Pencil } from "lucide-react";
import { getUser } from "../../../api/authAPI";
import { updateAccountFromProfile } from "../../../api/accountAPI";
import ChangeEmailModal from "./ChangeEmailModal";
import ProfileSidebar from "../../profile/ProfileSidebar";

function Profile() {
  const [profileLoading, setProfileLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [changeEmailModalVisible, setChangeEmailModalVisible] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({
    fullname: "",
    phoneNumber: "",
    gender: "",
  });

  const getUserProfile = async () => {
    try {
      setProfileLoading(true);
      const res = await getUser();
      setUser(res);
      setEmail(res.email || "");
      setForm({
        fullname: res.fullname || "",
        phoneNumber: res.phoneNumber || "",
        gender: res.gender || "",
      });
    } catch (error) {
      if (error?.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return;
      }
      toast.error(error?.response?.data?.message || "Failed to load profile");
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    getUserProfile();
  }, []);

  const hasChange =
    user &&
    (form.fullname !== user.fullname ||
      form.phoneNumber !== user.phoneNumber ||
      form.gender !== user.gender);

  const isValidPhone = (value) => /^0[1-9]\d{8,9}$/.test(value) && value.length >= 10 && value.length <= 11;

  const handleUpdate = async () => {
    if (!hasChange) {
      setEditOpen(false);
      toast.info("No changes detected");
      return;
    }

    if (!form.phoneNumber || !isValidPhone(form.phoneNumber)) {
      const message = "Invalid phone number\nPhone number must start with 0, contain 10-11 digits, and the first digit after 0 cannot be 0.";
      setPhoneError(message);
      toast.error(message);
      return;
    }

    setPhoneError("");

    try {
      setLoading(true);
      await updateAccountFromProfile({
        fullname: form.fullname,
        phoneNumber: form.phoneNumber,
        gender: form.gender,
      });
      await getUserProfile();
      setEditOpen(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    outline: "none",
    fontSize: "14px",
  };

  if (profileLoading) {
    return (
      <div style={{ minHeight: "60vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ fontSize: 18, color: "#6b7280" }}>Loading...</div>
      </div>
    );
  }

  return (
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
        <ProfileSidebar user={user} fetchProfile={getUserProfile} />

        <div
          style={{
            background: "#fff",
            borderRadius: "16px",
            padding: "30px",
            border: "1px solid #eee",
            boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: "24px", fontWeight: 700, color: "#1f2937" }}>My Profile</h2>
            <button
              onClick={() => {
                setPhoneError("");
                setEditOpen(true);
              }}
              style={{
                background: "#ff6b00",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                padding: "10px 14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontWeight: 600,
              }}
            >
              <Edit size={16} /> Edit Profile
            </button>
          </div>

          <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
            <Info icon={<User size={16} />} label="Username" value={user?.username} />

            <Info
              icon={<Mail size={16} />}
              label="Email"
              value={
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span>{email || "N/A"}</span>
                  <button
                    onClick={() => setChangeEmailModalVisible(true)}
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

            <Info icon={<Phone size={16} />} label="Phone" value={user?.phoneNumber || "N/A"} />
            <Info icon={<Venus size={16} />} label="Gender" value={user?.gender || "N/A"} />
            <Info icon={<Shield size={16} />} label="Role" value={user?.role || "N/A"} />
          </div>
        </div>
      </div>

      <ChangeEmailModal
        isOpen={changeEmailModalVisible}
        setToggleModal={setChangeEmailModalVisible}
        email={email}
      />

      {editOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              width: 420,
              background: "#fff",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>Edit Profile</h3>

            <input
              placeholder="Full name"
              value={form.fullname}
              onChange={(e) => setForm({ ...form, fullname: e.target.value })}
              style={inputStyle}
            />

            <div style={{ marginTop: 10 }}>
              <input
                placeholder="Phone number"
                value={form.phoneNumber}
                onChange={(e) => {
                  const value = e.target.value;
                  setForm({ ...form, phoneNumber: value });
                  if (!value) {
                    setPhoneError("Invalid phone number\nPhone number is required");
                  } else {
                    setPhoneError(isValidPhone(value) ? "" : "Invalid phone number\nPhone number must start with 0, contain 10-11 digits, and the first digit after 0 cannot be 0.");
                  }
                }}
                style={{ ...inputStyle, marginTop: 0 }}
              />
              {phoneError && (
                <div style={{ color: "#dc2626", fontSize: 13, marginTop: 6, whiteSpace: "pre-line" }}>{phoneError}</div>
              )}
            </div>

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
                disabled={!hasChange || loading}
                style={{
                  flex: 1,
                  background: hasChange && !loading ? "#ff6b00" : "#ccc",
                  color: "#fff",
                  padding: 12,
                  borderRadius: 10,
                  border: "none",
                  cursor: hasChange && !loading ? "pointer" : "not-allowed",
                }}
              >
                {loading ? "Saving..." : "Save"}
              </button>

              <button
                onClick={() => setEditOpen(false)}
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
    </div>
  );
}

const Info = ({ icon, label, value }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "12px 14px",
      background: "#f8fafc",
      borderRadius: 10,
      border: "1px solid #eef2f7",
      gap: 12,
    }}
  >
    <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#374151" }}>
      {icon} {label}
    </span>
    <b style={{ color: "#111827", textAlign: "right" }}>{value || "N/A"}</b>
  </div>
);

export default Profile;
