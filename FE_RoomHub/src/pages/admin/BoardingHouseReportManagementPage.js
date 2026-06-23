import { useCallback, useEffect, useState } from "react";
import AdminLayout from "../layout/admin/AdminLayout";
import {
  deleteReport,
  filterBoardingHouseReports,
  getBoardingHouseReports,
} from "../../api/report";

export default function BoardingHouseReportManagementPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    startDate: "",
    endDate: "",
  });
  const [isFiltered, setIsFiltered] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getBoardingHouseReports();
      setReports(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading boarding house reports:", error);
      alert(error.message || "Failed to load boarding house reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyFilter = async () => {
    const today = getTodayString();

    if (filters.startDate && filters.startDate > today) {
      alert("Start date cannot be in the future");
      return;
    }

    if (filters.endDate && filters.endDate > today) {
      alert("End date cannot be in the future");
      return;
    }

    if (filters.startDate && filters.endDate && filters.startDate > filters.endDate) {
      alert("Start date cannot be greater than end date");
      return;
    }

    try {
      setLoading(true);
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value)
      );
      const data = await filterBoardingHouseReports(params);
      setReports(Array.isArray(data) ? data : []);
      setIsFiltered(true);
    } catch (error) {
      console.error("Error filtering boarding house reports:", error);
      alert(error.message || "Failed to filter boarding house reports");
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilter = () => {
    setFilters({
      status: "",
      startDate: "",
      endDate: "",
    });
    setIsFiltered(false);
    fetchReports();
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;

    try {
      await deleteReport(reportId);
      alert("Report deleted successfully");

      if (isFiltered) {
        handleApplyFilter();
      } else {
        fetchReports();
      }
    } catch (error) {
      console.error("Error deleting report:", error);
      alert(error.message || "Failed to delete report");
    }
  };

  return (
    <AdminLayout>
      <div style={pageHeaderStyle}>
        <h2 style={titleStyle}>Boarding House Reports</h2>
      </div>

      <div style={filterPanelStyle}>
        <div style={filterGridStyle}>
          <div>
            <label style={filterLabelStyle}>Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              style={inputStyle}
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label style={filterLabelStyle}>Start date</label>
            <input
              type="date"
              name="startDate"
              max={getTodayString()}
              value={filters.startDate}
              onChange={handleFilterChange}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={filterLabelStyle}>End date</label>
            <input
              type="date"
              name="endDate"
              max={getTodayString()}
              value={filters.endDate}
              onChange={handleFilterChange}
              style={inputStyle}
            />
          </div>
        </div>
        <div style={filterActionStyle}>
          <button style={filterBtnStyle} onClick={handleApplyFilter}>
            Filter
          </button>
          <button style={clearBtnStyle} onClick={handleClearFilter}>
            Clear
          </button>
        </div>
      </div>

      <div style={tableCardStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              {[
                "No.",
                "Boarding House",
                "Reporter",
                "Reason",
                "Details",
                "Status",
                "Processed By",
                "Reply",
                "Submitted",
                "Actions",
              ].map((title) => (
                <th key={title} style={thStyle}>{title}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="10" style={emptyStyle}>Loading...</td>
              </tr>
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan="10" style={emptyStyle}>No boarding house reports found</td>
              </tr>
            ) : (
              reports.map((report, index) => (
                <tr key={report._id} style={rowStyle}>
                  <td style={tdStyle}>{index + 1}</td>
                  <td style={tdStyle}>
                    <div style={houseNameStyle}>{getBoardingHouseName(report)}</div>
                    <div style={mutedTextStyle}>{getAddress(report)}</div>
                    <div style={mutedTextStyle}>Price: {formatCurrency(report.targetId?.priceRange)}</div>
                    <div style={mutedTextStyle}>Rating: {displayValue(report.targetId?.rating)}</div>
                  </td>
                  <td style={tdStyle}>
                    <div>{displayValue(report.reporter?.fullname)}</div>
                    <div style={mutedTextStyle}>{displayValue(report.reporter?.email)}</div>
                  </td>
                  <td style={tdStyle}>{displayValue(report.reason)}</td>
                  <td style={tdStyle}>
                    <div style={textBlockStyle}>{displayValue(report.details)}</div>
                    <div style={mutedTextStyle}>Images: {getImageCount(report)}</div>
                  </td>
                  <td style={tdStyle}>
                    <span style={statusBadgeStyle(report.status)}>{displayValue(report.status)}</span>
                  </td>
                  <td style={tdStyle}>{displayValue(report.processedBy?.fullname)}</td>
                  <td style={tdStyle}>
                    <div style={textBlockStyle}>{displayValue(report.detailReport)}</div>
                  </td>
                  <td style={tdStyle}>{formatDateTime(report.createdAt)}</td>
                  <td style={tdStyle}>
                    <button style={deleteBtnStyle} onClick={() => handleDelete(report._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

const displayValue = (value, fallback = "N/A") => {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
};

const getTodayString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getBoardingHouseName = (report) => (
  displayValue(report.targetId?.name)
);

const getAddress = (report) => {
  const address = report.targetId?.address;
  if (!address) return "N/A";

  const fullAddress = [
    address.detail,
    address.ward?.name,
    address.district?.name,
    address.province?.name,
  ].filter(Boolean).join(", ");

  return displayValue(fullAddress);
};

const getImageCount = (report) => (
  Array.isArray(report.images) ? report.images.length : 0
);

const formatCurrency = (value) => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "N/A";

  return numberValue.toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
  });
};

const formatDateTime = (value) => (
  value ? new Date(value).toLocaleString() : "N/A"
);

const pageHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 24,
};

const titleStyle = {
  margin: 0,
  color: "#27364a",
  fontSize: 24,
  fontWeight: 700,
};

const filterPanelStyle = {
  background: "white",
  borderRadius: 10,
  padding: 16,
  marginBottom: 18,
  boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
};

const filterGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
};

const filterLabelStyle = {
  display: "block",
  marginBottom: 6,
  fontWeight: 600,
  color: "#27364a",
  fontSize: 13,
};

const filterActionStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 8,
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  fontSize: 14,
  marginBottom: 16,
  boxSizing: "border-box",
};

const tableCardStyle = {
  background: "white",
  borderRadius: 10,
  overflowX: "auto",
  boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
};

const tableStyle = {
  width: "100%",
  minWidth: 1300,
  borderCollapse: "collapse",
};

const rowStyle = {
  borderBottom: "1px solid #f3f4f6",
};

const thStyle = {
  padding: "12px 16px",
  textAlign: "left",
  fontWeight: 600,
  color: "#27364a",
  fontSize: 13,
  borderBottom: "1px solid #e5e7eb",
  background: "#f9fafb",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "12px 16px",
  fontSize: 14,
  color: "#374151",
  verticalAlign: "top",
};

const emptyStyle = {
  ...tdStyle,
  textAlign: "center",
  padding: 24,
};

const houseNameStyle = {
  fontWeight: 700,
  color: "#27364a",
};

const mutedTextStyle = {
  color: "#6b7280",
  fontSize: 12,
  marginTop: 4,
  maxWidth: 280,
};

const textBlockStyle = {
  maxWidth: 260,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

const statusBadgeStyle = (status) => {
  const colors = {
    pending: { background: "#fef3c7", color: "#b45309" },
    processing: { background: "#dbeafe", color: "#0369a1" },
    resolved: { background: "#dcfce7", color: "#166534" },
    rejected: { background: "#fee2e2", color: "#991b1b" },
  };

  return {
    ...(colors[status] || { background: "#f3f4f6", color: "#6b7280" }),
    padding: "4px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    display: "inline-block",
  };
};

const buttonStyle = {
  padding: "8px 14px",
  marginRight: 8,
  borderRadius: 6,
  border: "none",
  color: "white",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: 13,
};

const filterBtnStyle = {
  ...buttonStyle,
  background: "#3b82f6",
};

const clearBtnStyle = {
  ...buttonStyle,
  background: "#e5e7eb",
  color: "#374151",
};

const deleteBtnStyle = {
  ...buttonStyle,
  background: "#ef4444",
};
