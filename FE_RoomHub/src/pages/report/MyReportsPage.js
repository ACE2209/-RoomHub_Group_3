import { useCallback, useEffect, useState } from "react";
import { Eye, Flag } from "lucide-react";
import AdminLayout from "../layout/admin/AdminLayout";
import { getMyReportDetail, getMyReports } from "../../api/reportAPI";

const statusColor = {
  pending: { bg: "#fffaeb", color: "#b54708", border: "#fedf89" },
  processing: { bg: "#eef4ff", color: "#3538cd", border: "#c7d7fe" },
  resolved: { bg: "#ecfdf3", color: "#087443", border: "#abefc6" },
  rejected: { bg: "#fef3f2", color: "#b42318", border: "#fecdca" },
};

export default function MyReportsPage() {
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchReports = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await getMyReports({ page, limit: pagination.limit });
      setReports(res?.data || []);
      setPagination((prev) => ({
        ...prev,
        ...(res?.pagination || {}),
      }));
      setError("");
    } catch (err) {
      setReports([]);
      setError(err.message || "Unable to load reports");
    } finally {
      setLoading(false);
    }
  }, [pagination.limit]);

  useEffect(() => {
    fetchReports(1);
  }, [fetchReports]);

  const openDetail = async (reportId) => {
    try {
      setDetailLoading(true);
      const res = await getMyReportDetail(reportId);
      setSelectedReport(res?.data || null);
    } catch (err) {
      alert(err.message || "Unable to load report detail");
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div style={headerStyle}>
        <div>
          <h2 style={titleStyle}>My Reports</h2>
          <p style={subtitleStyle}>Track reports you submitted for boarding houses and reviews.</p>
        </div>
        <div style={summaryItemStyle}>
          <Flag size={18} />
          <span>{pagination.totalItems || 0} reports</span>
        </div>
      </div>

      <div style={tableCardStyle}>
        <table style={tableStyle}>
          <thead>
            <tr style={headerRowStyle}>
              <th style={thStyle}>Type</th>
              <th style={thStyle}>Target</th>
              <th style={thStyle}>Reason</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Created</th>
              <th style={thStyle}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={emptyStyle}>Loading reports...</td></tr>
            ) : error ? (
              <tr><td colSpan="6" style={emptyStyle}>{error}</td></tr>
            ) : reports.length ? (
              reports.map((report) => (
                <tr key={report._id} style={rowStyle}>
                  <td style={tdStyle}>{formatType(report.reportType)}</td>
                  <td style={{ ...tdStyle, maxWidth: 300 }}><span style={ellipsisStyle}>{report.targetName || "N/A"}</span></td>
                  <td style={tdStyle}>{report.reason}</td>
                  <td style={tdStyle}><StatusBadge status={report.status} /></td>
                  <td style={tdStyle}>{formatDate(report.createdAt)}</td>
                  <td style={tdStyle}>
                    <button style={iconBtnStyle} disabled={detailLoading} onClick={() => openDetail(report._id)} title="View detail">
                      <Eye size={17} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="6" style={emptyStyle}>No reports found</td></tr>
            )}
          </tbody>
        </table>

        <div style={paginationStyle}>
          <span style={subtitleStyle}>Showing {reports.length} of {pagination.totalItems || 0}</span>
          <div style={pageButtonWrapStyle}>
            <button style={pageBtnStyle(!pagination.hasPrevPage || loading)} disabled={!pagination.hasPrevPage || loading} onClick={() => fetchReports((pagination.currentPage || 1) - 1)}>Previous</button>
            <span style={pageTextStyle}>{pagination.currentPage || 1}/{pagination.totalPages || 1}</span>
            <button style={pageBtnStyle(!pagination.hasNextPage || loading)} disabled={!pagination.hasNextPage || loading} onClick={() => fetchReports((pagination.currentPage || 1) + 1)}>Next</button>
          </div>
        </div>
      </div>

      {selectedReport && (
        <div style={modalOverlayStyle} onClick={() => setSelectedReport(null)}>
          <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <h3 style={modalTitleStyle}>Report Detail</h3>
              <button style={closeBtnStyle} onClick={() => setSelectedReport(null)}>x</button>
            </div>

            <div style={detailGridStyle}>
              <DetailItem label="Type" value={formatType(selectedReport.reportType)} />
              <DetailItem label="Status" value={<StatusBadge status={selectedReport.status} />} />
              <DetailItem label="Reason" value={selectedReport.reason} />
              <DetailItem label="Created" value={formatDate(selectedReport.createdAt)} />
            </div>

            <DetailItem label="Details" value={selectedReport.details || "N/A"} />
            <DetailItem label="Admin Response" value={selectedReport.detailReport || "No response yet"} />

            <h4 style={sectionTitleStyle}>Target</h4>
            {selectedReport.reportType === "review" ? (
              <div style={targetBoxStyle}>
                <strong>{selectedReport.target?.accountId?.fullname || "Unknown reviewer"}</strong>
                <span>Rating: {selectedReport.target?.rating || "N/A"}</span>
                <p style={paragraphStyle}>{selectedReport.target?.content || "No content"}</p>
              </div>
            ) : (
              <div style={targetBoxStyle}>
                <strong>{selectedReport.target?.name || "Unknown boarding house"}</strong>
                <span>{selectedReport.target?.boardingHouseType?.name || "No type"}</span>
                <p style={paragraphStyle}>{formatAddress(selectedReport.target?.address)}</p>
              </div>
            )}

            {selectedReport.images?.length > 0 && (
              <>
                <h4 style={sectionTitleStyle}>Report Images</h4>
                <div style={imageGridStyle}>
                  {selectedReport.images.map((image) => (
                    <img key={image._id || image.imageUrl} src={image.imageUrl} alt="Report" style={imageStyle} />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function StatusBadge({ status }) {
  const style = statusColor[status] || statusColor.pending;
  return <span style={{ ...badgeStyle, background: style.bg, color: style.color, borderColor: style.border }}>{status || "pending"}</span>;
}

function DetailItem({ label, value }) {
  return (
    <div style={detailItemStyle}>
      <span style={detailLabelStyle}>{label}</span>
      <div style={detailValueStyle}>{value}</div>
    </div>
  );
}

const formatType = (type) => type === "boardingHouse" ? "Boarding House" : "Review";
const formatDate = (value) => value ? new Date(value).toLocaleString("en-GB") : "N/A";
const formatAddress = (address) => [address?.detail, address?.ward?.name, address?.district?.name, address?.province?.name].filter(Boolean).join(", ") || "N/A";

const headerStyle = { display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 18, flexWrap: "wrap" };
const titleStyle = { margin: 0, color: "#27364a", fontWeight: 700 };
const subtitleStyle = { color: "#667085", fontSize: 13 };
const summaryItemStyle = { display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 14px", color: "#344054", fontWeight: 600 };
const tableCardStyle = { background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" };
const tableStyle = { width: "100%", borderCollapse: "collapse" };
const headerRowStyle = { borderBottom: "1px solid #e5e7eb", background: "#f9fafb" };
const rowStyle = { borderBottom: "1px solid #f3f4f6" };
const thStyle = { padding: 16, textAlign: "left", color: "#344054", fontWeight: 700, fontSize: 13 };
const tdStyle = { padding: 16, color: "#344054", verticalAlign: "middle" };
const ellipsisStyle = { display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
const iconBtnStyle = { width: 36, height: 36, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "#eef4ff", color: "#2563eb", border: "1px solid #bfdbfe", borderRadius: 6, cursor: "pointer" };
const emptyStyle = { textAlign: "center", padding: 42, color: "#667085" };
const badgeStyle = { display: "inline-flex", alignItems: "center", border: "1px solid", borderRadius: 999, padding: "5px 10px", fontSize: 12, fontWeight: 700, textTransform: "capitalize" };
const paginationStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, padding: "14px 16px", borderTop: "1px solid #e5e7eb", flexWrap: "wrap" };
const pageButtonWrapStyle = { display: "flex", alignItems: "center", gap: 8 };
const pageTextStyle = { color: "#344054", fontWeight: 700, minWidth: 44, textAlign: "center" };
const pageBtnStyle = (disabled) => ({ padding: "8px 13px", borderRadius: 6, border: "1px solid #d0d5dd", background: disabled ? "#f2f4f7" : "#fff", color: disabled ? "#98a2b3" : "#344054", cursor: disabled ? "not-allowed" : "pointer", fontWeight: 700 });
const modalOverlayStyle = { position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 };
const modalStyle = { background: "#fff", borderRadius: 8, width: "min(760px, 100%)", maxHeight: "88vh", overflow: "auto", padding: 22, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" };
const modalHeaderStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16 };
const modalTitleStyle = { margin: 0, color: "#27364a" };
const closeBtnStyle = { width: 32, height: 32, borderRadius: 6, border: "1px solid #d0d5dd", background: "#fff", cursor: "pointer", color: "#344054" };
const detailGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 };
const detailItemStyle = { display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 };
const detailLabelStyle = { color: "#667085", fontSize: 12, fontWeight: 700, textTransform: "uppercase" };
const detailValueStyle = { color: "#344054", fontWeight: 600 };
const sectionTitleStyle = { margin: "18px 0 10px", color: "#27364a" };
const targetBoxStyle = { border: "1px solid #e5e7eb", borderRadius: 8, padding: 14, display: "flex", flexDirection: "column", gap: 6, color: "#344054" };
const paragraphStyle = { margin: 0, color: "#667085" };
const imageGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 };
const imageStyle = { width: "100%", aspectRatio: "1 / 1", objectFit: "cover", borderRadius: 8, border: "1px solid #e5e7eb" };
