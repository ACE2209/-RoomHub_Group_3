
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

import BHDetailPage from "../pages/admin/BHDetailPage";
import ProfilePage from "../pages/admin/ProfilePage";

import BoardingHouseDetailPage from "../pages/BoardingHouseDetailPage";

import ReportDetailPage from "../pages/admin/ReportManagement/ReportDetailPage";
import ReviewReportManagementPage from "../pages/admin/ReportManagement/ReviewReportManagementPage";
import BoardingHouseReportManagementPage from "../pages/admin/ReportManagement/BoardingHouseReportManagementPage";

import AppointmentPage from "../pages/user/AppointmentPage";
import CreateAppointmentPage from "../pages/user/CreateAppointmentPage";

import ProtectedRoute from "./ProtectedRoute";
import FavoritesPage from "../pages/user/FavoritesPage";
import WatchLaterPage from "../pages/user/WatchLaterPage";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Boarding House Detail */}
      <Route
        path="/boarding-houses/:boardingHouseId"
        element={<BoardingHouseDetailPage />}
      />

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

      <Route
        path="/appointments"
        element={
          <ProtectedRoute>
            <AppointmentPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/appointments/create/:roomId"
        element={
          <ProtectedRoute>
            <CreateAppointmentPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/favorites"
        element={
          <ProtectedRoute>
            <FavoritesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/watchlater"
        element={
          <ProtectedRoute>
            <WatchLaterPage />
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

      <Route
        path="/admin/boarding-house-reports"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <BoardingHouseReportManagementPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/boarding-houses/:boardingHouseId"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <BHDetailPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/profile"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
