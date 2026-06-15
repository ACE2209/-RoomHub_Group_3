import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../../layout/admin/AdminLayout";
import { deleteReport, filterReports, getReports } from "../../../api/report";

export default function ReviewReportManagementPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);

  const [filters, setFilters] = useState({
    reason: "",
    status: "",
    startDate: "",
    endDate: "",
  });

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const todayString = getTodayString();
  const minDateString = "2000-01-01";

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const normalizeReports = (res) => {
    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.data)) return res.data;
    if (Array.isArray(res?.reports)) return res.reports;
    if (Array.isArray(res?.items)) return res.items;
    return [];
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await getReports();
      console.log("REVIEW REPORTS DATA:", res);
      setReports(normalizeReports(res));
    } catch (error) {
      console.error("Get review reports failed:", error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    if ((name === "startDate" || name === "endDate") && value) {
      const selectedDate = new Date(`${value}T00:00:00`);
      const minDate = new Date(`${minDateString}T00:00:00`);

      const today = new Date();
      today.setHours(23, 59, 59, 999);

      if (selectedDate < minDate) {
        alert("Date cannot be before 01/01/2000");

        setFilters((prev) => ({
          ...prev,
          [name]: "",
        }));

        return;
      }

      if (selectedDate > today) {
        alert("Date cannot be in the future");

        setFilters((prev) => ({
          ...prev,
          [name]: "",
        }));

        return;
      }
    }

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleApplyFilter = async () => {
    const start = filters.startDate ? new Date(filters.startDate) : null;
    const end = filters.endDate ? new Date(filters.endDate) : null;

    if (start && end && start > end) {
      alert("Start date cannot be greater than end date");

      setFilters((prev) => ({
        ...prev,
        endDate: "",
      }));

      return;
    }

    try {
      setLoading(true);

      const params = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value)
      );

      const res = await filterReports(params);
      const data = normalizeReports(res);

      setReports(data);
      setShowFilter(false);

      if (data.length === 0) {
        alert("No review report data found");
      }
    } catch (error) {
      alert(error.message || "Filter failed. Please try again.");
      console.error("Filter review reports failed:", error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilter = async () => {
    setFilters({
      reason: "",
      status: "",
      startDate: "",
      endDate: "",
    });

    setShowFilter(false);
    await fetchReports();
  };

  const handleDelete = async (reportId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this review report?"
    );

    if (!confirmDelete) return;

    try {
      const res = await deleteReport(reportId);

      if (res?.message || res?.report) {
        alert("Review report deleted successfully");
        setReports((prev) => prev.filter((item) => item._id !== reportId));
      } else {
        alert(res?.error || "Delete failed");
      }
    } catch (error) {
      console.error("Delete review report failed:", error);
      alert("Delete failed");
    }
  };

  return (
    <AdminLayout>
      <div style={topStyle}>
        <h2 style={titleStyle}>Review Report Management</h2>

        <div style={filterMenuContainerStyle}>
          <button
            type="button"
            style={filterBtnStyle}
            onClick={() => setShowFilter((prev) => !prev)}
          >
            Filter
          </button>

          {showFilter && (
            <div style={filterPanelStyle}>
              <div style={filterPanelHeaderStyle}>Filter Review Reports</div>

              <div style={filterGroupStyle}>
                <label style={labelStyle}>Reason</label>
                <select
                  name="reason"
                  value={filters.reason}
                  onChange={handleFilterChange}
                  style={inputStyle}
                >
                  <option value="">All reasons</option>
                  <option value="Spam">Spam</option>
                  <option value="Misleading information">
                    Misleading information
                  </option>
                  <option value="Privacy violation">Privacy violation</option>
                  <option value="Inappropriate content">
                    Inappropriate content
                  </option>
                </select>
              </div>

              <div style={filterGroupStyle}>
                <label style={labelStyle}>Status</label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  style={inputStyle}
                >
                  <option value="">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processed">Processed</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div style={filterGroupStyle}>
                <label style={labelStyle}>Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  min={minDateString}
                  max={todayString}
                  onChange={handleFilterChange}
                  style={inputStyle}
                />
              </div>

              <div style={filterGroupStyle}>
                <label style={labelStyle}>End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  min={minDateString}
                  max={todayString}
                  onChange={handleFilterChange}
                  style={inputStyle}
                />
              </div>

              <div style={filterActionStyle}>
                <button
                  type="button"
                  style={applyBtnStyle}
                  onClick={handleApplyFilter}
                >
                  Apply
                </button>

                <button
                  type="button"
                  style={clearBtnStyle}
                  onClick={handleClearFilter}
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={cardStyle}>
        <table style={tableStyle}>
          <thead>
            <tr style={headerRowStyle}>
              <th style={thStyle}>No.</th>
              <th style={thStyle}>Reporter</th>
              <th style={thStyle}>Reason</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Created At</th>
              <th style={thStyle}>Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={emptyStyle}>
                  Loading review reports...
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

                  <td style={{ ...tdStyle, maxWidth: "360px" }}>
                    <div style={ellipsisStyle}>{report.reason || "N/A"}</div>
                  </td>

                  <td style={tdStyle}>
                    <span style={statusStyle}>
                      {report.status ||
                        (report.deleted ? "deleted" : "pending")}
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
                        to={`/admin/review-reports/${report._id}`}
                        style={viewBtnStyle}
                      >
                        View Detail
                      </Link>

                      <button
                        type="button"
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
                <td colSpan="6" style={emptyStyle}>
                  No review report data found
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
  alignItems: "center",
  marginBottom: "30px",
};

const titleStyle = {
  fontWeight: "700",
  color: "#27364a",
};

const filterMenuContainerStyle = {
  position: "relative",
};

const filterBtnStyle = {
  background: "#14b8a6",
  color: "white",
  border: "none",
  padding: "12px 24px",
  borderRadius: "10px",
  fontSize: "16px",
  fontWeight: "600",
  cursor: "pointer",
};

const filterPanelStyle = {
  position: "absolute",
  top: "52px",
  right: 0,
  width: "340px",
  background: "#ffffff",
  borderRadius: "14px",
  padding: "18px",
  boxShadow: "0 12px 35px rgba(0, 0, 0, 0.18)",
  border: "1px solid #e5e7eb",
  zIndex: 9999,
};

const filterPanelHeaderStyle = {
  fontSize: "18px",
  fontWeight: "700",
  color: "#27364a",
  marginBottom: "16px",
  paddingBottom: "12px",
  borderBottom: "1px solid #e5e7eb",
};

const filterGroupStyle = {
  marginBottom: "14px",
};

const labelStyle = {
  display: "block",
  marginBottom: "7px",
  color: "#111827",
  fontSize: "15px",
  fontWeight: "600",
};

const inputStyle = {
  width: "100%",
  height: "42px",
  padding: "0 12px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  fontSize: "15px",
  color: "#344054",
  outline: "none",
  background: "#ffffff",
  boxSizing: "border-box",
};

const filterActionStyle = {
  display: "flex",
  gap: "12px",
  marginTop: "18px",
};

const applyBtnStyle = {
  flex: 1,
  background: "#14b8a6",
  color: "white",
  border: "none",
  padding: "12px 0",
  borderRadius: "8px",
  fontSize: "15px",
  fontWeight: "600",
  cursor: "pointer",
};

const clearBtnStyle = {
  flex: 1,
  background: "#ef4444",
  color: "white",
  border: "none",
  padding: "12px 0",
  borderRadius: "8px",
  fontSize: "15px",
  fontWeight: "600",
  cursor: "pointer",
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