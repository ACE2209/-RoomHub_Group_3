import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
  getRoleHomePath,
  getStoredUser,
  isManagementRole,
  normalizeRole,
} from "../utils/roleNavigation";

const clearStoredSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

/**
 * Public pages are available to guests and tenant accounts only.
 * Management accounts remain inside their dashboard until they log out.
 */
const PublicRoute = ({ children, guestOnly = false }) => {
  const token = localStorage.getItem("token");
  const user = getStoredUser();

  if (!token || !user) {
    if (token || user) clearStoredSession();
    return children;
  }

  try {
    const decoded = jwtDecode(token);
    const tokenIsValid = !decoded.exp || decoded.exp * 1000 > Date.now();

    if (!tokenIsValid) {
      clearStoredSession();
      return children;
    }

    const role = normalizeRole(user.role || decoded.role);

    if (isManagementRole(role)) {
      return <Navigate to={getRoleHomePath(role)} replace />;
    }

    if (guestOnly && role === "user") {
      return <Navigate to="/" replace />;
    }

    return children;
  } catch (error) {
    clearStoredSession();
    return children;
  }
};

export default PublicRoute;
