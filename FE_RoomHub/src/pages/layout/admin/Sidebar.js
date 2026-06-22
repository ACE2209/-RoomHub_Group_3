import { NavLink, Link } from "react-router-dom";

export default function Sidebar() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const role = user?.role;
  const isAdmin = role === "admin";
  const canManageOwnBoardingHouses = role === "owner" || role === "staff";

  return (
    <aside className="sidebar">
      <Link to="/" className="logo">
        <img src="/image/logo.png" alt="RoomHub" />
      </Link>

      <nav className="menu">
        {isAdmin && <NavLink to="/admin">Dashboard</NavLink>}

        {isAdmin && (
          <NavLink to="/admin/accounts">
            Account Management
          </NavLink>
        )}

        {isAdmin && (
          <NavLink to="/admin/review-reports">
            Report Management
          </NavLink>
        )}

        {isAdmin && (
          <NavLink to="/admin/boarding-houses">
            Boarding House Management
          </NavLink>
        )}

        {isAdmin && (
          <NavLink to="/admin/reviews">
            Review Management
          </NavLink>
        )}

        {canManageOwnBoardingHouses && (
          <NavLink to="/my-boarding-houses">
            My Boarding Houses
          </NavLink>
        )}

        <NavLink to="/my-reports">
          My Reports
        </NavLink>
      </nav>

      <div className="sidebar-bottom">‹</div>
    </aside>
  );
}
