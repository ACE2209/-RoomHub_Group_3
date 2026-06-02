import {
    Routes,
    Route,
} from "react-router-dom";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";
import ReviewManagementPage from "../pages/admin/ReviewManagementPage";
import ReviewDetailPage from "../pages/admin/ReviewDetailPage";
import HomePage from "../pages/HomePage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import BoardingHouseManagementPage from "../pages/admin/BoardingHouseManagementPage";
import BHDetailPage from "../pages/admin/BHDetailPage";
import ProfilePage from "../pages/admin/ProfilePage";


const AppRoutes = () => {
    return (
        <Routes>

            <Route
                path="/"
                element={
                    <HomePage />
                }
            />

            <Route
                path="/login"
                element={<Login />}
            />

            <Route
                path="/register"
                element={<Register />}
            />

            <Route
                path="/forgot-password"
                element={<ForgotPassword />}
            />

            <Route
                path="/reset-password/:token"
                element={<ResetPassword />}
            />
<Route path="/admin/reviews" element={<ReviewManagementPage />} />
      <Route path="/admin/reviews/:reviewId" element={<ReviewDetailPage />} />
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/boarding-houses" element={<BoardingHouseManagementPage />} />
        <Route path="/admin/boarding-houses/:boardingHouseId" element={<BHDetailPage />} />
        <Route path="/admin/profile" element={<ProfilePage />} />
        </Routes >
    );
};

export default AppRoutes;
