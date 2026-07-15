import { Routes, Route, Navigate } from "react-router-dom";

import HomePage from "../pages/home/HomePage";

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

import BHDetailPage from "../pages/admin/BHDetailPage";
import ProfilePage from "../pages/admin/ProfilePage";

import ReportDetailPage from "../pages/admin/ReportManagement/ReportDetailPage";
import ReviewReportManagementPage from "../pages/admin/ReportManagement/ReviewReportManagementPage";
import BoardingHouseReportManagementPage from "../pages/admin/BoardingHouseReportManagementPage";

import BoardingHouseDetailPage from "../pages/home/BoardingHouseDetailPage";
import RoomDetailPage from "../pages/home/RoomDetailPage";
import RoomTypeRoomsPage from "../pages/home/RoomTypeRoomsPage";

import MyBoardingHousesPage from "../pages/ownerandstaff/MyBoardingHousesPage";
import OwnerBoardingHouseDetailPage from "../pages/ownerandstaff/OwnerBoardingHouseDetailPage";
import AppointmentManagementPage from "../pages/ownerandstaff/AppointmentManagementPage";
import DepositManagementPage from "../pages/ownerandstaff/DepositManagementPage";
import ManagedReviewsPage from "../pages/ownerandstaff/ManagedReviewsPage";
import MyReportsPage from "../pages/report/MyReportsPage";

import AppointmentPage from "../pages/user/AppointmentPage";
import CreateDepositPage from "../pages/user/CreateDepositPage";
import FavoritesPage from "../pages/user/FavoritesPage";
import MyDepositsPage from "../pages/user/MyDepositsPage";
import PaymentResultPage from "../pages/user/PaymentResultPage";
import MyMonthlyRentsPage from "../pages/user/MyMonthlyRentsPage";
import MyMonthlyRentDetailPage from "../pages/user/MyMonthlyRentDetailPage";

import ProtectedRoute from "./ProtectedRoute";
import WatchLaterPage from "../pages/user/WatchLaterPage";

import ManageRooms from "../pages/ownerandstaff/ManageRooms";
import ManageRoomAdditionalFees from "../pages/ownerandstaff/ManageRoomAdditionalFees";
import ManageMonthlyRents from "../pages/ownerandstaff/ManageMonthlyRents";
import ManageMonthlyRentDetail from "../pages/ownerandstaff/ManageMonthlyRentDetail";

import ManageRoomTypes from "../pages/ownerandstaff/ManageRoomTypes";
import StaffManagementPage from "../pages/ownerandstaff/StaffManagementPage";
import TaskManagementPage from "../pages/ownerandstaff/TaskManagementPage";
import MyPaymentBillsPage from "../pages/user/MyPaymentBillsPage";
import MyRefundRequestsPage from "../pages/user/MyRefundRequestsPage";
import ManagedRefundRequestsPage from "../pages/ownerandstaff/ManagedRefundRequestsPage";
import TotalRevenuePage from "../pages/admin/Revenue/TotalRevenuePage";
import BoardingHouseRevenuePage from "../pages/admin/Revenue/BoardingHouseRevenuePage";
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Boarding House */}
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

      {/* User */}
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
        path="/deposits/create/:roomId"
        element={
          <ProtectedRoute>
            <CreateDepositPage />
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

      <Route
        path="/my-reports"
        element={
          <ProtectedRoute>
            <MyReportsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-deposits"
        element={
          <ProtectedRoute>
            <MyDepositsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/payment-result"
        element={
          <ProtectedRoute>
            <PaymentResultPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/monthly-rents"
        element={
          <ProtectedRoute>
            <MyMonthlyRentsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/monthly-rent"
        element={
          <ProtectedRoute>
            <MyMonthlyRentsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/monthly-rents/:userPaymentId"
        element={
          <ProtectedRoute>
            <MyMonthlyRentDetailPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/monthly-rent/:userPaymentId"
        element={
          <ProtectedRoute>
            <MyMonthlyRentDetailPage />
          </ProtectedRoute>
        }
      />

      {/* Owner & Staff */}
      <Route
        path="/my-boarding-houses"
        element={
          <ProtectedRoute allowedRoles={["owner", "staff"]}>
            <MyBoardingHousesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-boarding-houses/:id"
        element={
          <ProtectedRoute allowedRoles={["owner", "staff"]}>
            <OwnerBoardingHouseDetailPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/managed-appointments"
        element={
          <ProtectedRoute allowedRoles={["owner", "staff"]}>
            <AppointmentManagementPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/managed-deposits"
        element={
          <ProtectedRoute allowedRoles={["owner", "staff"]}>
            <DepositManagementPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/managed-reviews"
        element={
          <ProtectedRoute allowedRoles={["owner", "staff"]}>
            <ManagedReviewsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/manage-rooms"
        element={
          <ProtectedRoute allowedRoles={["owner", "staff"]}>
            <ManageRooms />
          </ProtectedRoute>
        }
      />

      <Route
        path="/manage-room-additional-fees"
        element={
          <ProtectedRoute allowedRoles={["owner", "staff"]}>
            <ManageRoomAdditionalFees />
          </ProtectedRoute>
        }
      />

      <Route
        path="/manage-monthly-rents"
        element={
          <ProtectedRoute allowedRoles={["owner", "staff"]}>
            <ManageMonthlyRents />
          </ProtectedRoute>
        }
      />

      <Route
        path="/manage-monthly-rents/:billId"
        element={
          <ProtectedRoute allowedRoles={["owner", "staff"]}>
            <ManageMonthlyRentDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/manage-room-types"
        element={
          <ProtectedRoute allowedRoles={["owner", "staff"]}>
            <ManageRoomTypes />
          </ProtectedRoute>
        }
      />

      <Route
        path="/staff-management"
        element={
          <ProtectedRoute allowedRoles={["owner"]}>
            <StaffManagementPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/task-management"
        element={
          <ProtectedRoute allowedRoles={["owner", "staff"]}>
            <TaskManagementPage />
          </ProtectedRoute>
        }
      />

      {/* Admin */}
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
            <Navigate to="/admin/review-reports" replace />
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
      <Route
        path="/my-payment-bills"
        element={
          <ProtectedRoute>
            <MyPaymentBillsPage />
          </ProtectedRoute>
        }
      />
      <Route path="/my-refund-requests" element={<MyRefundRequestsPage />} />
      <Route path="/owner/refund-requests" element={<ManagedRefundRequestsPage />} />
      <Route path="/staff/refund-requests" element={<ManagedRefundRequestsPage />} />
      <Route
        path="/managed-refund-requests"
        element={
          <ProtectedRoute allowedRoles={["owner", "staff"]}>
            <ManagedRefundRequestsPage />
          </ProtectedRoute>
        }
      />
      <Route
  path="/admin/revenue/total"
  element={
    <ProtectedRoute allowedRoles={["admin"]}>
      <TotalRevenuePage />
    </ProtectedRoute>
  }
/>

<Route
  path="/admin/revenue/boarding-houses"
  element={
    <ProtectedRoute allowedRoles={["admin"]}>
      <BoardingHouseRevenuePage />
    </ProtectedRoute>
  }
/>
    </Routes>
  );
};

export default AppRoutes;