import { Navigate, Route, Routes } from "react-router-dom";

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
import AddBoardingHousePage from "../pages/admin/AddBoardingHousePage";
import ProfilePage from "../pages/admin/ProfilePage";
import ReportDetailPage from "../pages/admin/ReportManagement/ReportDetailPage";
import ReviewReportManagementPage from "../pages/admin/ReportManagement/ReviewReportManagementPage";
import BoardingHouseReportManagementPage from "../pages/admin/BoardingHouseReportManagementPage";
import TotalRevenuePage from "../pages/admin/Revenue/TotalRevenuePage";
import BoardingHouseRevenuePage from "../pages/admin/Revenue/BoardingHouseRevenuePage";

import BoardingHouseDetailPage from "../pages/home/BoardingHouseDetailPage";
import RoomDetailPage from "../pages/home/RoomDetailPage";
import RoomTypeRoomsPage from "../pages/home/RoomTypeRoomsPage";

import MyBoardingHousesPage from "../pages/ownerandstaff/MyBoardingHousesPage";
import OwnerBoardingHouseDetailPage from "../pages/ownerandstaff/OwnerBoardingHouseDetailPage";
import AppointmentManagementPage from "../pages/ownerandstaff/AppointmentManagementPage";
import DepositManagementPage from "../pages/ownerandstaff/DepositManagementPage";
import ManagedReviewsPage from "../pages/ownerandstaff/ManagedReviewsPage";
import ManageRooms from "../pages/ownerandstaff/ManageRooms";
import ManageRoomAdditionalFees from "../pages/ownerandstaff/ManageRoomAdditionalFees";
import ManageMonthlyRents from "../pages/ownerandstaff/ManageMonthlyRents";
import ManageMonthlyRentDetail from "../pages/ownerandstaff/ManageMonthlyRentDetail";
import ManageRoomTypes from "../pages/ownerandstaff/ManageRoomTypes";
import StaffManagementPage from "../pages/ownerandstaff/StaffManagementPage";
import TaskManagementPage from "../pages/ownerandstaff/TaskManagementPage";
import ManagedRefundRequestsPage from "../pages/ownerandstaff/ManagedRefundRequestsPage";
import ManagedRenewalRequestsPage from "../pages/ownerandstaff/ManagedRenewalRequestsPage";
import ManageExpensesPage from "../pages/ownerandstaff/ManageExpensesPage";

import MyReportsPage from "../pages/report/MyReportsPage";
import AppointmentPage from "../pages/user/AppointmentPage";
import CreateDepositPage from "../pages/user/CreateDepositPage";
import FavoritesPage from "../pages/user/FavoritesPage";
import MyDepositsPage from "../pages/user/MyDepositsPage";
import PaymentResultPage from "../pages/user/PaymentResultPage";
import MyMonthlyRentsPage from "../pages/user/MyMonthlyRentsPage";
import MyMonthlyRentDetailPage from "../pages/user/MyMonthlyRentDetailPage";
import WatchLaterPage from "../pages/user/WatchLaterPage";
import MyPaymentBillsPage from "../pages/user/MyPaymentBillsPage";
import MyRefundRequestsPage from "../pages/user/MyRefundRequestsPage";
import MyRenewalRequestsPage from "../pages/user/MyRenewalRequestsPage";

import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";

const publicPage = (element) => <PublicRoute>{element}</PublicRoute>;
const guestPage = (element) => <PublicRoute guestOnly>{element}</PublicRoute>;
const userPage = (element) => (
  <ProtectedRoute allowedRoles={["user"]}>{element}</ProtectedRoute>
);
const managerPage = (element, allowedRoles = ["owner", "staff"]) => (
  <ProtectedRoute allowedRoles={allowedRoles}>{element}</ProtectedRoute>
);
const adminPage = (element) => (
  <ProtectedRoute allowedRoles={["admin"]}>{element}</ProtectedRoute>
);

const AppRoutes = () => {
  return (
    <Routes>
      {/* Guest and tenant-facing pages. Management roles are redirected. */}
      <Route path="/" element={publicPage(<HomePage />)} />
      <Route path="/login" element={guestPage(<Login />)} />
      <Route path="/register" element={guestPage(<Register />)} />
      <Route path="/forgot-password" element={guestPage(<ForgotPassword />)} />
      <Route
        path="/reset-password/:token"
        element={guestPage(<ResetPassword />)}
      />

      <Route
        path="/boarding-houses/:boardingHouseId"
        element={publicPage(<BoardingHouseDetailPage />)}
      />
      <Route
        path="/boardinghouse/:boardingHouseId"
        element={publicPage(<BoardingHouseDetailPage />)}
      />
      <Route
        path="/boarding-house/:boardingHouseId"
        element={publicPage(<BoardingHouseDetailPage />)}
      />
      <Route
        path="/room-types/:roomTypeId/rooms"
        element={publicPage(<RoomTypeRoomsPage />)}
      />
      <Route path="/rooms/:roomId" element={publicPage(<RoomDetailPage />)} />

      {/* Tenant-only pages */}
      <Route path="/profile" element={userPage(<Profile />)} />
      <Route path="/change-password" element={userPage(<ChangePassword />)} />
      <Route path="/appointments" element={userPage(<AppointmentPage />)} />
      <Route
        path="/deposits/create/:roomId"
        element={userPage(<CreateDepositPage />)}
      />
      <Route path="/favorites" element={userPage(<FavoritesPage />)} />
      <Route path="/watchlater" element={userPage(<WatchLaterPage />)} />
      <Route path="/my-reports" element={userPage(<MyReportsPage />)} />
      <Route path="/my-deposits" element={userPage(<MyDepositsPage />)} />
      <Route
        path="/payment-result"
        element={userPage(<PaymentResultPage />)}
      />
      <Route
        path="/monthly-rents"
        element={userPage(<MyMonthlyRentsPage />)}
      />
      <Route
        path="/monthly-rent"
        element={userPage(<MyMonthlyRentsPage />)}
      />
      <Route
        path="/monthly-rents/:userPaymentId"
        element={userPage(<MyMonthlyRentDetailPage />)}
      />
      <Route
        path="/monthly-rent/:userPaymentId"
        element={userPage(<MyMonthlyRentDetailPage />)}
      />
      <Route
        path="/my-payment-bills"
        element={userPage(<MyPaymentBillsPage />)}
      />
      <Route
        path="/my-refund-requests"
        element={userPage(<MyRefundRequestsPage />)}
      />
      <Route
        path="/my-renewal-requests"
        element={userPage(<MyRenewalRequestsPage />)}
      />

      {/* Owner and staff dashboard pages */}
      <Route
        path="/owner/dashboard"
        element={managerPage(<Navigate to="/my-boarding-houses" replace />, ["owner"])}
      />
      <Route
        path="/staff/dashboard"
        element={managerPage(<Navigate to="/my-boarding-houses" replace />, ["staff"])}
      />
      <Route
        path="/management/profile"
        element={managerPage(<ProfilePage />)}
      />
      <Route
        path="/my-boarding-houses"
        element={managerPage(<MyBoardingHousesPage />)}
      />
      <Route
        path="/my-boarding-houses/:id"
        element={managerPage(<OwnerBoardingHouseDetailPage />)}
      />
      <Route
        path="/managed-appointments"
        element={managerPage(<AppointmentManagementPage />)}
      />
      <Route
        path="/managed-deposits"
        element={managerPage(<DepositManagementPage />)}
      />
      <Route
        path="/managed-reviews"
        element={managerPage(<ManagedReviewsPage />)}
      />
      <Route path="/manage-rooms" element={managerPage(<ManageRooms />)} />
      <Route
        path="/manage-room-additional-fees"
        element={managerPage(<ManageRoomAdditionalFees />)}
      />
      <Route
        path="/manage-monthly-rents"
        element={managerPage(<ManageMonthlyRents />)}
      />
      <Route
        path="/manage-monthly-rents/:billId"
        element={managerPage(<ManageMonthlyRentDetail />)}
      />
      <Route
        path="/manage-room-types"
        element={managerPage(<ManageRoomTypes />)}
      />
      <Route
        path="/staff-management"
        element={managerPage(<StaffManagementPage />, ["owner"])}
      />
      <Route
        path="/task-management"
        element={managerPage(<TaskManagementPage />)}
      />
      <Route
        path="/owner/refund-requests"
        element={managerPage(<ManagedRefundRequestsPage />, ["owner"])}
      />
      <Route
        path="/staff/refund-requests"
        element={managerPage(<ManagedRefundRequestsPage />, ["staff"])}
      />
      <Route
        path="/managed-refund-requests"
        element={managerPage(<ManagedRefundRequestsPage />)}
      />
      <Route
        path="/managed-renewal-requests"
        element={managerPage(<ManagedRenewalRequestsPage />)}
      />
      <Route
        path="/manage-expenses"
        element={managerPage(<ManageExpensesPage />)}
      />

      {/* Admin dashboard pages */}
      <Route
        path="/admin/dashboard"
        element={adminPage(<Navigate to="/admin" replace />)}
      />
      <Route path="/admin" element={adminPage(<AdminDashboardPage />)} />
      <Route
        path="/admin/accounts"
        element={adminPage(<AccountManagementPage />)}
      />
      <Route
        path="/admin/reviews"
        element={adminPage(<ReviewManagementPage />)}
      />
      <Route
        path="/admin/reviews/:reviewId"
        element={adminPage(<ReviewDetailPage />)}
      />
      <Route
        path="/admin/reports"
        element={adminPage(<Navigate to="/admin/review-reports" replace />)}
      />
      <Route
        path="/admin/review-reports"
        element={adminPage(<ReviewReportManagementPage />)}
      />
      <Route
        path="/admin/review-reports/:reportId"
        element={adminPage(<ReportDetailPage />)}
      />
      <Route
        path="/admin/boarding-houses"
        element={adminPage(<BoardingHouseManagementPage />)}
      />
      <Route
        path="/admin/boarding-house-reports"
        element={adminPage(<BoardingHouseReportManagementPage />)}
      />
      <Route
        path="/admin/boarding-houses/new"
        element={adminPage(<AddBoardingHousePage />)}
      />
      <Route
        path="/admin/boarding-houses/:boardingHouseId"
        element={adminPage(<BHDetailPage />)}
      />
      <Route path="/admin/profile" element={adminPage(<ProfilePage />)} />
      <Route
        path="/admin/revenue/total"
        element={adminPage(<TotalRevenuePage />)}
      />
      <Route
        path="/admin/revenue/boarding-houses"
        element={adminPage(<BoardingHouseRevenuePage />)}
      />

      {/* Unknown public/user URL goes home; management accounts go dashboard. */}
      <Route path="*" element={publicPage(<Navigate to="/" replace />)} />
    </Routes>
  );
};

export default AppRoutes;
