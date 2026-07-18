import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    const token = localStorage.getItem("token");
    let user = null;
    let tokenIsValid = false;

    try {
        user = JSON.parse(localStorage.getItem("user"));
        const decoded = token ? jwtDecode(token) : null;
        tokenIsValid = Boolean(decoded && (!decoded.exp || decoded.exp * 1000 > Date.now()));
    } catch (error) {
        tokenIsValid = false;
    }

    if (!tokenIsValid || !user) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return <Navigate to="/login" replace />;
    }

    if (
        allowedRoles.length > 0 &&
        !allowedRoles.includes(user.role)
    ) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;
