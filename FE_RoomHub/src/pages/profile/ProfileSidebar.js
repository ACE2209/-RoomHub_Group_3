import {
  User,
  Lock,
  Calendar,
  WalletCards,
  Receipt,
  RotateCcw,
  CalendarPlus,
  FileText,
  Camera
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useRef, useState } from "react";
import Swal from "sweetalert2";
import { updateAvatar } from "../../api/accountAPI";

const ProfileSidebar = ({ user, fetchProfile }) => {
  const location = useLocation();
  const fileRef = useRef(null);
  const [avatarLoading, setAvatarLoading] = useState(false);

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
      if (fetchProfile) await fetchProfile();
      Swal.fire({ toast: true, position: "top-end", icon: "success", title: "Avatar updated", showConfirmButton: false, timer: 1500 });
    } catch (error) {
      Swal.fire({ icon: "error", title: "Upload failed", text: error?.response?.data?.message });
    } finally {
      setAvatarLoading(false);
    }
  };

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <aside
      style={{
        width: "300px",
        background: "#fff",
        borderRadius: "16px",
        padding: "20px",
        border: "1px solid #eee",
        boxShadow: "0 8px 20px rgba(0,0,0,0.06)",
        position: "sticky",
        top: "20px",
        height: "fit-content",
      }}
    >
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ position: "relative", width: 140, height: 140 }}>
          <img
            src={
              user?.avatarImage?.url ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                user?.fullname || "User"
              )}&background=ff6b00&color=fff&size=200`
            }
            alt={user?.fullname || "User"}
            style={{
              width: "140px",
              height: "140px",
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
              width: 36,
              height: 36,
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
            <Camera size={16} color="#fff" />
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

      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontWeight: 700 }}>{user?.fullname || "User"}</h2>
        <p style={{ color: "#777" }}>@{user?.username || "user"}</p>
      </div>

      <div
        style={{
          marginTop: 20,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <Link to="/profile" style={{ textDecoration: "none" }}>
          <MenuItem
            icon={<User size={18} />}
            label="Profile Info"
            active={isActive("/profile")}
          />
        </Link>

        <Link to="/change-password" style={{ textDecoration: "none" }}>
          <MenuItem
            icon={<Lock size={18} />}
            label="Change Password"
            active={isActive("/change-password")}
          />
        </Link>

        <Link to="/appointments" style={{ textDecoration: "none" }}>
          <MenuItem
            icon={<Calendar size={18} />}
            label="Appointments"
            active={isActive("/appointments")}
          />
        </Link>

        <Link to="/my-deposits" style={{ textDecoration: "none" }}>
          <MenuItem
            icon={<WalletCards size={18} />}
            label="My Deposits"
            active={isActive("/my-deposits")}
          />
        </Link>

        <Link to="/my-refund-requests" style={{ textDecoration: "none" }}>
          <MenuItem
            icon={<RotateCcw size={18} />}
            label="My Refund Requests"
            active={isActive("/my-refund-requests")}
          />
        </Link>

        <Link to="/my-renewal-requests" style={{ textDecoration: "none" }}>
          <MenuItem
            icon={<CalendarPlus size={18} />}
            label="My Renewal Requests"
            active={isActive("/my-renewal-requests")}
          />
        </Link>

        <Link to="/monthly-rents" style={{ textDecoration: "none" }}>
          <MenuItem
            icon={<Receipt size={18} />}
            label="Monthly Rent"
            active={isActive("/monthly-rents")}
          />
        </Link>
      </div>
    </aside>
  );
};

const MenuItem = ({ icon, label, active }) => {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 14px",
        borderRadius: 12,
        fontWeight: 600,
        cursor: "pointer",
        background: active ? "#ff6b00" : "transparent",
        color: active ? "#fff" : "#444",
        transition: "0.2s",
      }}
    >
      {icon}
      {label}
    </div>
  );
};

export default ProfileSidebar;