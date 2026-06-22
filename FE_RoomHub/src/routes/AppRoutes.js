import { Routes, Route, Navigate } from "react-router-dom";

import HomePage from "../pages/HomePage";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";
import ChangePassword from "../pages/auth/ChangePassword";
import Profile from "../pages/profile/Profile";

import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AccountManagementPage from "../pages/admin/AccountManagementPage";
import BoardingHouseManagementPage from "../pages/admin/BoardingHouseManagementPage";
import ReviewManagementPage from "../pages/admin/ReviewManagementPage";
import ReviewDetailPage from "../pages/admin/ReviewDetailPage";

import BoardingHouseDetailPage from "../pages/BoardingHouseDetailPage";
import RoomDetailPage from "../pages/RoomDetailPage";
import RoomTypeRoomsPage from "../pages/RoomTypeRoomsPage";

import MyBoardingHousesPage from "../pages/owner/MyBoardingHousesPage";
import OwnerBoardingHouseDetailPage from "../pages/owner/OwnerBoardingHouseDetailPage";
import MyReportsPage from "../pages/report/MyReportsPage";

import ReportDetailPage from "../pages/admin/ReportManagement/ReportDetailPage";
import ReviewReportManagementPage from "../pages/admin/ReportManagement/ReviewReportManagementPage";
import BoardingHouseReportManagementPage from "../pages/admin/ReportManagement/BoardingHouseReportManagementPage";

import AppointmentPage from "../pages/user/AppointmentPage";
import CreateAppointmentPage from "../pages/user/CreateAppointmentPage";
import CreateDepositPage from "../pages/user/CreateDepositPage";
import FavoritesPage from "../pages/user/FavoritesPage";

import ProtectedRoute from "./ProtectedRoute";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Boarding House Routes */}
      <Route
        path="/boarding-houses/:boardingHouseId"
        element={<BoardingHouseDetailPage />}
      />
      <Route
        path="/boardinghouse/:boardingHouseId"
        element={<BoardingHouseDetailPage />}
      />
      <Route
        path="/boarding-house/:boardingHouseId"
        element={<BoardingHouseDetailPage />}
      />
      <Route
        path="/room-types/:roomTypeId/rooms"
        element={<RoomTypeRoomsPage />}
      />
      <Route path="/rooms/:roomId" element={<RoomDetailPage />} />

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
        path="/deposits/create/:roomId"
        element={