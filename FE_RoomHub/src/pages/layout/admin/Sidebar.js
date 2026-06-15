import { useState } from "react";
import { NavLink, Link } from "react-router-dom";

export default function Sidebar() {
  const [openReportMenu, setOpenReportMenu] = useState(true);

  return (
    <aside className="sidebar">
      <Link to="/" className="logo">
        <img src="/image/logo.png" alt="RoomHub" />
      </Link>

      <nav className="menu">
        <NavLink to="/admin">Dashboard</NavLink>

        <NavLink to="/admin/accounts">
          Account Management
        </NavLink>

        {/* REPORT MANAGEMENT */}
        <div
          className="menu-parent"
          onClick={() => setOpenReportMenu(!openReportMenu)}
        >
          <span>Report Management</span>
          <span>{openReportMenu ? "⌃" : "⌄"}</span>
        </div>

        {openReportMenu && (
          <div className="submenu">
            <NavLink
              to="/admin/review-reports"
              className="submenu-item"
            >
              Report Review
            </NavLink>

            <NavLink
              to="/admin/boardinghouse-reports"
              className="submenu-item"
            >
              Report Boarding House
            </NavLink>
          </div>
        )}

        <NavLink to="/admin/boarding-houses">
          Boarding House Management
        </NavLink>

        <NavLink to="/admin/reviews">
          Review Management
        </NavLink>
      </nav>

      <div className="sidebar-bottom">‹</div>
    </aside>
  );
}