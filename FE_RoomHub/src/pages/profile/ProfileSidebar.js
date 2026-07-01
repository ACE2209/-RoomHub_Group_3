import { User, Lock, Calendar, WalletCards, Receipt } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const ProfileSidebar = ({ user }) => {
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

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
                <img
                    src={
                        user?.avatarImage?.url ||
                        `https://ui-avatars.com/api/?name=${user?.fullname || "User"}`
                    }
                    alt="avatar"
                    style={{
                        width: "140px",
                        height: "140px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "4px solid #ff6b00",
                    }}
                />
            </div>
            <div style={{ textAlign: "center" }}>
                <h2 style={{ fontWeight: 700 }}>{user?.fullname}</h2>
                <p style={{ color: "#777" }}>@{user?.username}</p>
            </div>
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
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
                </Link><Link to="/my-deposits" style={{ textDecoration: "none" }}>
  <MenuItem
    icon={<WalletCards size={18} />}
    label="My Deposits"
    active={isActive("/my-deposits")}
  />
</Link>

<Link to="/monthly-rent" style={{ textDecoration: "none" }}>
  <MenuItem
    icon={<Receipt size={18} />}
    label="Monthly Rent"
    active={isActive("/monthly-rent")}
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