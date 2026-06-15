import { NavLink, Link } from "react-router-dom";

export default function Sidebar() {
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

        <NavLink to="/admin/review-reports">
          Report Management
        </NavLink>

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