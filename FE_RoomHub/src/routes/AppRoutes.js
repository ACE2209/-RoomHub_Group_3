import {
    Routes,
    Route,
} from "react-router-dom";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";
import ChangePassword from "../pages/auth/ChangePassword";
import Profile from "../pages/profile/Profile";
import HomePage from "../pages/HomePage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AccountManagementPage from "../pages/admin/AccountManagementPage";
import ReviewManagementPage from "../pages/admin/ReviewManagementPage";
import ReviewDetailPage from "../pages/admin/ReviewDetailPage";
import ReportManagementPage from "../pages/admin/ReportManagementPage";
import ReportDetailPage from "../pages/admin/ReportDetailPage";
import BoardingHouseManagementPage from "../pages/admin/BoardingHouseManagementPage";

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/change-password" element={<ChangePassword />} />

            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/accounts" element={<AccountManagementPage />} />
            <Route path="/admin/reviews" element={<ReviewManagementPage />} />
            <Route path="/admin/reviews/:reviewId" element={<ReviewDetailPage />} />
            <Route path="/admin/reports" element={<ReportManagementPage />} />
            <Route path="/admin/reports/:reportId" element={<ReportDetailPage />} />
            <Route path="/admin/boarding-houses" element={<BoardingHouseManagementPage />} />

            <Route path="/profile" element={<Profile />} />
        </Routes>
    );
};

export default AppRoutes;
