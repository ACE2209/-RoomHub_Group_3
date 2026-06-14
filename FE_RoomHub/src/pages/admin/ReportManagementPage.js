import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../layout/admin/AdminLayout";
import { deleteReport, getReports } from "../../api/report";

export default function ReportManagementPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await getReports();
      console.log("REPORTS DATA:", res);
      setReports(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error("Get reports failed:", error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reportId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this report?"
    );

    if (!confirmDelete) return;

    try {
      const res = await deleteReport(reportId);

      if (res?.message || res?.report) {
        alert("Report deleted successfully");
        setReports((prev) => prev.filter((item) => item._id !== reportId));
      } else {
        alert(res?.error || "Delete failed");
      }
    } catch (error) {
      console.error("Delete report failed:", error);
      alert("Delete failed");
    }
  };

  return (
    <AdminLayout>
      <div style={topStyle}>
        <h2 style={titleStyle}>Report Management</h2>
      </div>

      <div style={cardStyle}>
        <table style={tableStyle}>
          <thead>
            <tr style={headerRowStyle}>
              <th style={thStyle}>No.</th>
              <th style={thStyle}>Reporter</th>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Reason</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Created At</th>
              <th style={thStyle}>Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={emptyStyle}>
                  Loading reports...
                </td>
              </tr>
            ) : reports.length > 0 ? (
              reports.map((report, index) => (
                <tr key={report._id} style={rowStyle}>
                  <td style={tdStyle}>{index + 1}</td>
                  <td style={tdStyle}>
                    {report.reporter?.fullname ||
                      report.reporter?.email ||
                      "N/A"}
                  </td>
                  <td style={tdStyle}>{report.reportType || "N/A"}</td>
                  <td style={{ ...tdStyle, maxWidth: "340px" }}>
                    <div style={ellipsisStyle}>{report.reason || "N/A"}</div>
                  </td>
                  <td style={tdStyle}>
                    <span style={statusStyle}>
                      {report.status || (report.deleted ? "deleted" : "pending")}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    {report.createdAt
                      ? new Date(report.createdAt).toLocaleDateString("en-GB")
                      : "N/A"}
                  </td>
                  <td style={tdStyle}>
                    <div style={actionStyle}>
                      <Link
                        to={`/admin/reports/${report._id}`}
                        style={viewBtnStyle}
                      >
                        View Detail
                      </Link>

                      <button
                        onClick={() => handleDelete(report._id)}
                        style={deleteBtnStyle}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={emptyStyle}>
                  No report data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

const topStyle = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "30px",
  alignItems: "center",
};

const titleStyle = {
  fontWeight: "700",
  color: "#27364a",
};

const cardStyle = {
  background: "white",
  borderRadius: "10px",
  overflow: "hidden",
  boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
};

const headerRowStyle = {
  borderBottom: "1px solid #e5e7eb",
};

const rowStyle = {
  borderBottom: "1px solid #f3f4f6",
};

const thStyle = {
  padding: "18px",
  textAlign: "left",
  color: "#344054",
  fontWeight: "700",
};

const tdStyle = {
  padding: "18px",
  color: "#344054",
};

const emptyStyle = {
  textAlign: "center",
  padding: "40px",
  color: "#667085",
};

const ellipsisStyle = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const statusStyle = {
  background: "#eef6ff",
  color: "#175cd3",
  padding: "5px 10px",
  borderRadius: "20px",
  fontWeight: "600",
  textTransform: "capitalize",
};

const actionStyle = {
  display: "flex",
  gap: "8px",
};

const viewBtnStyle = {
  background: "#2f80ed",
  color: "white",
  padding: "8px 14px",
  borderRadius: "6px",
  textDecoration: "none",
};

const deleteBtnStyle = {
  background: "#d92d20",
  color: "white",
  border: "none",
  padding: "8px 14px",
  borderRadius: "6px",
  cursor: "pointer",
};
