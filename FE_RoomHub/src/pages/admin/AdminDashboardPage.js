import AdminLayout from "../layout/admin/AdminLayout";

export default function AdminDashboardPage() {
  return (
    <AdminLayout>
      <div className="admin-dashboard">
        <h2 className="dashboard-title">Admin Dashboard</h2>
        <p className="dashboard-subtitle">
          Welcome to RoomHub admin management system.
        </p>
        </div>
    </AdminLayout>
  );
}