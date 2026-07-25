import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import AdminLayout from "../../layout/admin/AdminLayout";
import {
  deleteReport,
  filterReports,
  getReports,
} from "../../../api/report";

export default function ReviewReportManagementPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);

  // Không còn status vì Admin chỉ xem report.
  const [filters, setFilters] = useState({
    reason: "",
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
  }, []);

  /**
   * Chuẩn hóa dữ liệu trả về từ API thành mảng.
   */
  const normalizeReports = (response) => {
    if (Array.isArray(response)) {
      return response;
    }

    if (Array.isArray(response?.data)) {
      return response.data;
    }

    if (Array.isArray(response?.reports)) {
      return response.reports;
    }

    if (Array.isArray(response?.items)) {
      return response.items;
    }

    if (Array.isArray(response?.data?.reports)) {
      return response.data.reports;
    }

    if (Array.isArray(response?.data?.items)) {
      return response.data.items;
    }

    return [];
  };

  /**
   * Chỉ giữ report có đối tượng bị report là review.
   *
   * Phần kiểm tra được viết linh hoạt vì API có thể trả:
   * reportType, targetType hoặc type.
   */
  const getReviewReportsOnly = (data) => {
    return data.filter((report) => {
      const type = String(
        report?.reportType ||
          report?.targetType ||
          report?.type ||
          "",
      ).toLowerCase();

      // Nếu BE chưa trả type, vẫn giữ dữ liệu để tránh bảng bị rỗng.
      if (!type) {
        return true;
      }

      return type === "review";
    });
  };

  /**
   * Lấy toàn bộ report review.
   */
  const fetchReports = async () => {
    try {
      setLoading(true);

      const response = await getReports();

      console.log("REVIEW REPORTS DATA:", response);

      const normalizedData = normalizeReports(response);
      const reviewReports = getReviewReportsOnly(normalizedData);

      setReports(reviewReports);
    } catch (error) {
      console.error("Get review reports failed:", error);

      setReports([]);

      alert(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load review reports.",
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Kiểm tra ngày hợp lệ khi người dùng chọn bộ lọc.
   */
  const handleFilterChange = (event) => {
    const { name, value } = event.target;

    if (
      (name === "startDate" || name === "endDate") &&
      value
    ) {
      const selectedDate = new Date(`${value}T00:00:00`);
      const minimumDate = new Date(
        `${minDateString}T00:00:00`,
      );

      const today = new Date();
      today.setHours(23, 59, 59, 999);

      if (selectedDate < minimumDate) {
        alert("Date cannot be before 01/01/2000");

        setFilters((previous) => ({
          ...previous,
          [name]: "",
        }));

        return;
      }

      if (selectedDate > today) {
        alert("Date cannot be in the future");

        setFilters((previous) => ({
          ...previous,
          [name]: "",
        }));

        return;
      }
    }

    setFilters((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /**
   * Áp dụng bộ lọc.
   *
   * Không gửi status lên API nữa.
   */
  const handleApplyFilter = async () => {
    const startDate = filters.startDate
      ? new Date(`${filters.startDate}T00:00:00`)
      : null;

    const endDate = filters.endDate
      ? new Date(`${filters.endDate}T23:59:59`)
      : null;

    if (
      startDate &&
      endDate &&
      startDate.getTime() > endDate.getTime()
    ) {
      alert("Start date cannot be greater than end date");

      setFilters((previous) => ({
        ...previous,
        endDate: "",
      }));

      return;
    }

    try {
      setLoading(true);

      const params = Object.fromEntries(
        Object.entries(filters).filter(
          ([, value]) => String(value).trim() !== "",
        ),
      );

      // Xác định rõ đây là report review nếu API hỗ trợ reportType.
      params.reportType = "review";

      const response = await filterReports(params);

      const normalizedData = normalizeReports(response);
      const reviewReports =
        getReviewReportsOnly(normalizedData);

      setReports(reviewReports);
      setShowFilter(false);

      if (reviewReports.length === 0) {
        alert("No review report data found");
      }
    } catch (error) {
      console.error("Filter review reports failed:", error);

      setReports([]);

      alert(
        error?.response?.data?.message ||
          error?.message ||
          "Filter failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Xóa toàn bộ điều kiện lọc và tải lại danh sách.
   */
  const handleClearFilter = async () => {
    setFilters({
      reason: "",
      startDate: "",
      endDate: "",
    });

    setShowFilter(false);

    await fetchReports();
  };

  /**
   * Xóa report khỏi hệ thống.
   *
   * Đây không phải xử lý trạng thái report.
   * Nếu spec chỉ cho phép xem mà không cho xóa,
   * có thể bỏ nút Delete và hàm này.
   */
  const handleDelete = async (reportId) => {
    if (!reportId) {
      alert("Report ID not found");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this review report?",
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await deleteReport(reportId);

      if (
        response?.message ||
        response?.report ||
        response?.data
      ) {
        alert("Review report deleted successfully");

        setReports((previous) =>
          previous.filter(
            (report) => report._id !== reportId,
          ),
        );

        return;
      }

      alert(response?.error || "Delete failed");
    } catch (error) {
      console.error("Delete review report failed:", error);

      alert(
        error?.response?.data?.message ||
          error?.message ||
          "Delete failed",
      );
    }
  };

  return (
    <AdminLayout>
      <div style={topStyle}>
        <div>
          <h2 style={titleStyle}>
            Review Report Management
          </h2>

          <p style={subtitleStyle}>
            View reports submitted by users about reviews.
          </p>
        </div>

        <div style={filterMenuContainerStyle}>
          <button
            type="button"
            style={filterBtnStyle}
            onClick={() =>
              setShowFilter((previous) => !previous)
            }
          >
            Filter
          </button>

          {showFilter && (
            <div style={filterPanelStyle}>
              <div style={filterPanelHeaderStyle}>
                Filter Review Reports
              </div>

              <div style={filterGroupStyle}>
                <label style={labelStyle}>
                  Reason
                </label>

                <select
                  name="reason"
                  value={filters.reason}
                  onChange={handleFilterChange}
                  style={inputStyle}
                >
                  <option value="">
                    All reasons
                  </option>

                  <option value="Spam">
                    Spam
                  </option>

                  <option value="Misleading information">
                    Misleading information
                  </option>

                  <option value="Privacy violation">
                    Privacy violation
                  </option>

                  <option value="Inappropriate content">
                    Inappropriate content
                  </option>

                  <option value="Offensive language">
                    Offensive language
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>
              </div>

              <div style={filterGroupStyle}>
                <label style={labelStyle}>
                  Start Date
                </label>

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
                <label style={labelStyle}>
                  End Date
                </label>

                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  min={
                    filters.startDate || minDateString
                  }
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
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Apply"}
                </button>

                <button
                  type="button"
                  style={clearBtnStyle}
                  onClick={handleClearFilter}
                  disabled={loading}
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={cardStyle}>
        <div style={tableWrapperStyle}>
          <table style={tableStyle}>
            <thead>
              <tr style={headerRowStyle}>
                <th style={thStyle}>No.</th>

                <th style={thStyle}>
                  Reporter
                </th>

                <th style={thStyle}>
                  Reason
                </th>

                <th style={thStyle}>
                  Created At
                </th>

                <th style={thStyle}>
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    style={emptyStyle}
                  >
                    Loading review reports...
                  </td>
                </tr>
              ) : reports.length > 0 ? (
                reports.map((report, index) => {
                  const reporter =
                    report.reporter ||
                    report.reporterId ||
                    report.userId;

                  return (
                    <tr
                      key={report._id || index}
                      style={rowStyle}
                    >
                      <td style={tdStyle}>
                        {index + 1}
                      </td>

                      <td style={tdStyle}>
                        <div style={reporterStyle}>
                          <strong>
                            {reporter?.fullname ||
                              reporter?.fullName ||
                              reporter?.username ||
                              "N/A"}
                          </strong>

                          {reporter?.email && (
                            <span
                              style={reporterEmailStyle}
                            >
                              {reporter.email}
                            </span>
                          )}
                        </div>
                      </td>

                      <td
                        style={{
                          ...tdStyle,
                          maxWidth: "360px",
                        }}
                      >
                        <div
                          style={ellipsisStyle}
                          title={report.reason || "N/A"}
                        >
                          {report.reason || "N/A"}
                        </div>
                      </td>

                      <td style={tdStyle}>
                        {formatDate(report.createdAt)}
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
                            onClick={() =>
                              handleDelete(report._id)
                            }
                            style={deleteBtnStyle}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    style={emptyStyle}
                  >
                    No review report data found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}

const formatDate = (value) => {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleString("en-GB");
};

const topStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
  marginBottom: "30px",
};

const titleStyle = {
  margin: 0,
  fontWeight: "700",
  color: "#27364a",
};

const subtitleStyle = {
  margin: "8px 0 0",
  color: "#667085",
  fontSize: "14px",
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

const tableWrapperStyle = {
  width: "100%",
  overflowX: "auto",
};

const tableStyle = {
  width: "100%",
  minWidth: "850px",
  borderCollapse: "collapse",
};

const headerRowStyle = {
  borderBottom: "1px solid #e5e7eb",
  background: "#f8fafc",
};

const rowStyle = {
  borderBottom: "1px solid #f3f4f6",
};

const thStyle = {
  padding: "18px",
  textAlign: "left",
  color: "#344054",
  fontWeight: "700",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "18px",
  color: "#344054",
  verticalAlign: "middle",
};

const emptyStyle = {
  textAlign: "center",
  padding: "40px",
  color: "#667085",
};

const reporterStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const reporterEmailStyle = {
  color: "#667085",
  fontSize: "13px",
};

const ellipsisStyle = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const actionStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
};

const viewBtnStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#2f80ed",
  color: "white",
  padding: "8px 14px",
  borderRadius: "6px",
  textDecoration: "none",
  fontWeight: "600",
  whiteSpace: "nowrap",
};

const deleteBtnStyle = {
  background: "#d92d20",
  color: "white",
  border: "none",
  padding: "8px 14px",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "600",
  whiteSpace: "nowrap",
};