import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children }) {
    const user = localStorage.getItem("user");
    const location = useLocation();

    if (!user) {
        return (
            <Navigate
                to="/loginpage"
                replace
                state={{
                    message: "Vui lòng đăng nhập để xem chi tiết mentor",
                    redirectTo: location.pathname
                }}
            />
        );
    }

    return children;
}
