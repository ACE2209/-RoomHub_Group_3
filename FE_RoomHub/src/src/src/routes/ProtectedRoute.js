import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
  getRoleHomePath,
  getStoredUser,
  normalizeRole,
} from "../utils/roleNavigation";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const token = localStorage.getItem("token");
  const user = getStoredUser();

  let decoded = null;
  let tokenIsValid = false;

  try {
    decoded = token ? jwtDecode(token) : null;
    tokenIsValid = Boolean(
      decoded && (!decoded.exp || decoded.exp * 1000 > Date.now())
    );
  } catch (error) {
    tokenIsValid = false;
  }

  if (!tokenIsValid || !user) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }

  const role = normalizeRole(user.role || decoded?.role);
  const normalizedAllowedRoles = allowedRoles.map(normalizeRole);

  if (!role) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }

  if (
    normalizedAllowedRoles.length > 0 &&
    !normalizedAllowedRoles.includes(role)
  ) {
    return <Navigate to={getRoleHomePath(role)} replace />;
  }

  return children;
};

export default ProtectedRoute;
