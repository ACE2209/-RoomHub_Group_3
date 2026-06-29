import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import "./sidebar.css";

export default function Sidebar() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const role = user?.role;

  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const dropdownRef = useRef(null);

  const isAdmin = role === "admin";
  const canManageOwnBoardingHouses = role === "owner" || role === "staff";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        console.log("Click outside detected - closing dropdown");
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      const timer = setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);

      return () => {
        clearTimeout(timer);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showUserMenu]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleNavigateToProfile = () => {
    navigate(role === "admin" ? "/admin/profile" : "/profile");
    setShowUserMenu(false);
  };

  return (
    <aside className="sidebar">
      <Link to="/" className="logo">
        <img src="/image/logo.png" alt="RoomHub" />
      </Link>

      <nav className="menu">
        {isAdmin && (
          <NavLink to="/admin">
            Dashboard
          </NavLink>
        )}

        {isAdmin && (
          <NavLink to="/admin/accounts">
            Account Management
          </NavLink>
        )}

        {isAdmin && (
          <>
            <NavLink to="/admin/review-reports">
              Review Reports
            </NavLink>

            <NavLink to="/admin/boarding-house-reports">
              Boarding House Reports
            </NavLink>

            <NavLink to="/admin/boarding-houses">
              Boarding House Management
            </NavLink>

            <NavLink to="/admin/reviews">
              Review Management
            </NavLink>
          </>
        )}

        {canManageOwnBoardingHouses && (
          <>
            <NavLink to="/my-boarding-houses">
              My Boarding Houses
            </NavLink>

            <NavLink to="/managed-appointments">
              Appointment Management
            </NavLink>

            <NavLink to="/managed-deposits">
              Deposit Management
            </NavLink>

            <NavLink to="/managed-reviews">
              Review Management
            </NavLink>

            <NavLink to="/manage-rooms">
              Manage Rooms
            </NavLink>

            <NavLink to="/manage-room-additional-fees">
              Manage Room Additional Fees
            </NavLink>
          </>
        )}

      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-user-container" ref={dropdownRef}>
          <button
            className="sidebar-user-trigger"
            onClick={() => {
              console.log("Button clicked - toggling dropdown");
              setShowUserMenu(!showUserMenu);
            }}
            aria-expanded={showUserMenu}
            aria-label="User menu"
          >
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">
                {user?.fullname || user?.username || "User"}
              </span>
              <span className="sidebar-user-role">
                {role?.charAt(0).toUpperCase() + role?.slice(1)}
              </span>
            </div>

            <svg
              className={`sidebar-arrow ${showUserMenu ? "open" : ""}`}
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          {showUserMenu && (
            <div className="sidebar-dropdown">
              <button
                onClick={handleNavigateToProfile}
                className="sidebar-dropdown-item profile"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>My Profile</span>
              </button>

              <div className="sidebar-dropdown-divider"></div>

              <button
                onClick={handleLogout}
                className="sidebar-dropdown-item logout"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
