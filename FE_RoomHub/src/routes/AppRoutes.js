import { Routes, Route, Navigate } from "react-router-dom";

import HomePage from "../pages/HomePage";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";

import ChangePassword from "../pages/auth/ChangePassword";
import Profile from "../pages/profile/Profile";

import BoardingHouseManagementPage from "../pages/admin/BoardingHouseManagementPage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AccountManagementPage from "../pages/admin/AccountManagementPage";

import ReviewManagementPage from "../pages/admin/ReviewManagementPage";
import ReviewDetailPage from "../pages/admin/ReviewDetailPage";

import ReportDetailPage from "../pages/admin/ReportManagement/ReportDetailPage";
import ReviewReportManagementPage from "../pages/admin/ReportManagement/ReviewReportManagementPage";

import BoardingHouseDetail from "../pages/boardingHouse/BoardingHouseDetail";

import ProtectedRoute from "./ProtectedRoute";
import AppointmentPage from "../pages/user/AppointmentPage";
import CreateAppointmentPage from "../pages/user/CreateAppointmentPage";
import BoardingHouseReportManagementPage from "../pages/admin/ReportManagement/BoardingHouseReportManagementPage";
const AppRoutes = () => {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/boardinghouse/:id" element={<BoardingHouseDetail />} />

            {/* User Routes */}
            <Route
                path="/profile"
                element={
                    <ProtectedRoute>
                        <Profile />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/change-password"
                element={
                    <ProtectedRoute>
                        <ChangePassword />
                    </ProtectedRoute>
                }
            />

            {/* Admin Routes */}
            <Route
                path="/admin"
                element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                        <AdminDashboardPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin/accounts"
                element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                        <AccountManagementPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin/reviews"
                element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                        <ReviewManagementPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin/reviews/:reviewId"
                element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                        <ReviewDetailPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin/reports"
                element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                        <Navigate
                            to="/admin/review-reports"
                            replace
                        />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin/review-reports"
                element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                        <ReviewReportManagementPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin/review-reports/:reportId"
                element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                        <ReportDetailPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin/boarding-houses"
                element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                        <BoardingHouseManagementPage />
                    </ProtectedRoute>
                }
            />
            <Route path="/appointments"element={<ProtectedRoute><AppointmentPage /></ProtectedRoute>}/>
            <Route path="/appointments/create/:roomId"element={<ProtectedRoute><CreateAppointmentPage /></ProtectedRoute>}/>
        <Route
    path="/admin/boarding-house-reports"
    element={
        <ProtectedRoute allowedRoles={["admin"]}>
            <BoardingHouseReportManagementPage />
        </ProtectedRoute>
    }
/>
        </Routes>
    );
};

export default AppRoutes;