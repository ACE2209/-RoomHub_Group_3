import {
  User,
  Lock,
  Calendar,
  WalletCards,
  Receipt,
  RotateCcw,
  CalendarPlus,
  FileText,
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
    location.pathname === path ||
    location.pathname.startsWith(`${path}/`);

  const menuItems = [
    {
      path: "/profile",
      label: "Profile Info",
      icon: <User size={18} />,
    },
    {
      path: "/change-password",
      label: "Change Password",
      icon: <Lock size={18} />,
    },
    {
      path: "/appointments",
      label: "Appointments",
      icon: <Calendar size={18} />,
    },
    {
      path: "/my-deposits",
      label: "My Deposits",
      icon: <WalletCards size={18} />,
    },
    {
      path: "/my-refund-requests",
      label: "My Refund Requests",
      icon: <RotateCcw size={18} />,
    },
    {
      path: "/my-renewal-requests",
      label: "My Renewal Requests",
      icon: <CalendarPlus size={18} />,
    },
    {
      path: "/monthly-rents",
      label: "Monthly Rent",
      icon: <Receipt size={18} />,
    },
    {
      path: "/my-reports",
      label: "My Reports",
      icon: <FileText size={18} />,
    },
  ];

  return (
    <aside
      style={{
        width: "300px",
        flexShrink: 0,
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
      <div
        style={{
          display: "flex",
          justifyContent: "center",
        }}
      >
        <img
          src={
            user?.avatarImage?.url ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              user?.fullname || "User"
            )}`
          }
          alt={user?.fullname || "User"}
          style={{
            width: "140px",
            height: "140px",
            borderRadius: "50%",
            objectFit: "cover",
            border: "4px solid #ff6b00",
          }}
        />
      </div>

      <div
        style={{
          textAlign: "center",
        }}
      >
        <h2
          style={{
            margin: "12px 0 4px",
            fontWeight: 700,
            color: "#222",
          }}
        >
          {user?.fullname || "User"}
        </h2>

        <p
          style={{
            margin: 0,
            color: "#777",
          }}
        >
          @{user?.username || "user"}
        </p>
      </div>

      <nav
        style={{
          marginTop: 20,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            style={{
              textDecoration: "none",
            }}
          >
            <MenuItem
              icon={item.icon}
              label={item.label}
              active={isActive(item.path)}
            />
          </Link>
        ))}
      </nav>
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
        minHeight: "48px",
        padding: "12px 14px",
        borderRadius: 12,
        fontWeight: 600,
        cursor: "pointer",
        background: active ? "#ff6b00" : "transparent",
        color: active ? "#fff" : "#444",
        transition: "background 0.2s ease, color 0.2s ease",
      }}
      onMouseEnter={(event) => {
        if (!active) {
          event.currentTarget.style.background = "#fff3eb";
          event.currentTarget.style.color = "#ff6b00";
        }
      }}
      onMouseLeave={(event) => {
        if (!active) {
          event.currentTarget.style.background = "transparent";
          event.currentTarget.style.color = "#444";
        }
      }}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
};

export default ProfileSidebar;