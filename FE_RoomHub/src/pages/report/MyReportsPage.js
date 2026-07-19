import { useCallback, useEffect, useState } from "react";
import { Eye, Flag } from "lucide-react";

import { getProfileAPI } from "../../api/accountAPI";
import {
  getMyReportDetail,
  getMyReports,
} from "../../api/reportAPI";

import Header from "../layout/homepage/header";
import Footer from "../layout/homepage/footer";
import ProfileSidebar from "../profile/ProfileSidebar";

export default function MyReportsPage() {
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
    hasPrevPage: false,
    hasNextPage: false,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedReport, setSelectedReport] = useState(null);
  const [detailLoadingId, setDetailLoadingId] = useState("");

  /**
   * Tải thông tin tài khoản để hiển thị trong ProfileSidebar.
   */
  const fetchProfile = useCallback(async () => {
    try {
      const profileRes = await getProfileAPI();

      setUser(profileRes?.data || profileRes || null);
    } catch (err) {
      console.error("Load profile failed:", err);
      setUser(null);
    }
  }, []);

  /**
   * Tải danh sách report của tài khoản đang đăng nhập.
   */
  const fetchReports = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setError("");

        const response = await getMyReports({
          page,
          limit: pagination.limit,
        });

        const reportData = Array.isArray(response?.data)
          ? response.data
          : [];

        const paginationData = response?.pagination || {};

        setReports(reportData);

        setPagination((prev) => ({
          ...prev,
          ...paginationData,
          currentPage:
            paginationData.currentPage ??
            paginationData.page ??
            page,
          totalPages:
            paginationData.totalPages ??
            paginationData.pages ??
            1,
          totalItems:
            paginationData.totalItems ??
            paginationData.totalData ??
            response?.totalItems ??
            response?.totalData ??
            reportData.length,
          hasPrevPage:
            paginationData.hasPrevPage ??
            page > 1,
          hasNextPage:
            paginationData.hasNextPage ??
            page <
              (paginationData.totalPages ??
                paginationData.pages ??
                1),
        }));
      } catch (err) {
        console.error("Load reports failed:", err);

        setReports([]);
        setError(
          err?.message ||
            "Unable to load reports.",
        );
      } finally {
        setLoading(false);
      }
    },
    [pagination.limit],
  );

  useEffect(() => {
    fetchProfile();
    fetchReports(1);
  }, [fetchProfile, fetchReports]);

  /**
   * Lấy chi tiết report rồi mở modal.
   */
  const openDetail = async (reportId) => {
    try {
      setDetailLoadingId(reportId);

      const response = await getMyReportDetail(reportId);
      const reportDetail = response?.data || null;

      if (!reportDetail) {
        window.alert("Report detail not found.");
        return;
      }

      setSelectedReport(reportDetail);
    } catch (err) {
      console.error("Load report detail failed:", err);

      window.alert(
        err?.message ||
          "Unable to load report detail.",
      );
    } finally {
      setDetailLoadingId("");
    }
  };

  const goToPreviousPage = () => {
    const currentPage = Number(
      pagination.currentPage || 1,
    );

    if (currentPage <= 1 || loading) {
      return;
    }

    fetchReports(currentPage - 1);
  };

  const goToNextPage = () => {
    const currentPage = Number(
      pagination.currentPage || 1,
    );

    const totalPages = Number(
      pagination.totalPages || 1,
    );

    if (currentPage >= totalPages || loading) {
      return;
    }

    fetchReports(currentPage + 1);
  };

  const currentPage = Number(
    pagination.currentPage || 1,
  );

  const totalPages = Math.max(
    Number(pagination.totalPages || 1),
    1,
  );

  const hasPreviousPage =
    pagination.hasPrevPage ??
    currentPage > 1;

  const hasNextPage =
    pagination.hasNextPage ??
    currentPage < totalPages;

  return (
    <>
      <Header />

      <div style={styles.page}>
        <ProfileSidebar user={user} />

        <main style={styles.content}>
          <div style={styles.header}>
            <div>
              <h1 style={styles.title}>
                My Reports
              </h1>

              <p style={styles.subtitle}>
                View detailed information and
                processing results for reports you
                submitted.
              </p>
            </div>

            <div style={styles.summary}>
              <Flag size={18} />

              <span>
                {pagination.totalItems || 0} reports
              </span>
            </div>
          </div>

          <div style={styles.tableCard}>
            <div style={styles.tableScroll}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.th}>Type</th>

                    <th style={styles.th}>
                      Target
                    </th>

                    <th style={styles.th}>
                      Reason
                    </th>

                    <th style={styles.th}>
                      Created
                    </th>

                    <th style={styles.th}>
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        style={styles.empty}
                      >
                        Loading reports...
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td
                        colSpan={6}
                        style={styles.error}
                      >
                        {error}
                      </td>
                    </tr>
                  ) : reports.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        style={styles.empty}
                      >
                        No reports found.
                      </td>
                    </tr>
                  ) : (
                    reports.map((report) => (
                      <tr
                        key={report._id}
                        style={styles.tableRow}
                      >
                        <td style={styles.td}>
                          {formatType(
                            report.reportType,
                          )}
                        </td>

                        <td
                          style={{
                            ...styles.td,
                            maxWidth: 260,
                          }}
                        >
                          <span
                            style={styles.ellipsis}
                            title={
                              report.targetName ||
                              "N/A"
                            }
                          >
                            {report.targetName ||
                              "N/A"}
                          </span>
                        </td>

                        <td style={styles.td}>
                          {report.reason || "N/A"}
                        </td>

                       

                        <td style={styles.td}>
                          {formatDate(
                            report.createdAt,
                          )}
                        </td>

                        <td style={styles.td}>
                          <button
                            type="button"
                            style={{
                              ...styles.detailButton,
                              opacity:
                                detailLoadingId ===
                                report._id
                                  ? 0.6
                                  : 1,
                              cursor:
                                detailLoadingId ===
                                report._id
                                  ? "not-allowed"
                                  : "pointer",
                            }}
                            disabled={
                              detailLoadingId ===
                              report._id
                            }
                            onClick={() =>
                              openDetail(report._id)
                            }
                            title="View report detail"
                          >
                            <Eye size={17} />

                            <span>
                              {detailLoadingId ===
                              report._id
                                ? "Loading..."
                                : "Detail"}
                            </span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={styles.pagination}>
              <span style={styles.paginationInfo}>
                Showing {reports.length} of{" "}
                {pagination.totalItems || 0}
              </span>

              <div
                style={styles.paginationActions}
              >
                <button
                  type="button"
                  style={getPageButtonStyle(
                    !hasPreviousPage || loading,
                  )}
                  disabled={
                    !hasPreviousPage || loading
                  }
                  onClick={goToPreviousPage}
                >
                  Previous
                </button>

                <span style={styles.pageText}>
                  {currentPage}/{totalPages}
                </span>

                <button
                  type="button"
                  style={getPageButtonStyle(
                    !hasNextPage || loading,
                  )}
                  disabled={
                    !hasNextPage || loading
                  }
                  onClick={goToNextPage}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() =>
            setSelectedReport(null)
          }
        />
      )}

      <Footer />
    </>
  );
}

function ReportDetailModal({
  report,
  onClose,
}) {
  const target = report?.target;

  return (
    <div
      style={styles.modalOverlay}
      onClick={onClose}
    >
      <div
        style={styles.modal}
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div style={styles.modalHeader}>
          <div>
            <h2 style={styles.modalTitle}>
              My Report Detail
            </h2>

            <p style={styles.modalSubtitle}>
              Detailed information about the report
              you submitted.
            </p>
          </div>

          <button
            type="button"
            style={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div style={styles.detailGrid}>
          <DetailItem
            label="Report ID"
            value={report?._id}
          />

          <DetailItem
            label="Type"
            value={formatType(
              report?.reportType,
            )}
          />

        <DetailItem
            label="Reason"
            value={report?.reason || "N/A"}
          />

          <DetailItem
            label="Submitted"
            value={formatDate(
              report?.createdAt,
            )}
          />

          <DetailItem
            label="Last Updated"
            value={formatDate(
              report?.updatedAt,
            )}
          />
        </div>

        <Section title="Your Description">
          <p style={styles.paragraphBox}>
            {report?.details ||
              report?.description ||
              "N/A"}
          </p>
        </Section>

        <Section title="Admin Response">
          <p style={styles.paragraphBox}>
            {report?.detailReport ||
              report?.adminResponse ||
              report?.response ||
              "No response yet"}
          </p>
        </Section>

        <Section title="Reported Target">
          {report?.reportType === "review" ? (
            <ReviewTarget target={target} />
          ) : (
            <BoardingHouseTarget
              target={target}
            />
          )}
        </Section>

        <ImageGallery
          title="Report Evidence"
          images={report?.images}
        />

        {report?.reportType === "review" && (
          <ImageGallery
            title="Reported Review Images"
            images={target?.images}
          />
        )}

        <div style={styles.modalFooter}>
          <button
            type="button"
            style={styles.modalCloseButton}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewTarget({ target }) {
  if (!target) {
    return (
      <div style={styles.deletedTarget}>
        This review was deleted or no longer
        exists.
      </div>
    );
  }

  const reviewer =
    target.accountId ||
    target.userId ||
    target.reviewer;

  const boardingHouse =
    target.boardingHouseId ||
    target.boardingHouse;

  return (
    <div style={styles.targetBox}>
      <strong style={styles.targetTitle}>
        {reviewer?.fullname ||
          reviewer?.username ||
          "Unknown reviewer"}
      </strong>

      <span>
        Reviewer email:{" "}
        <b>{reviewer?.email || "N/A"}</b>
      </span>

      <span>
        Boarding house:{" "}
        <b>{boardingHouse?.name || "N/A"}</b>
      </span>

      <span>
        Rating:{" "}
        <b>
          {target.rating != null
            ? `${target.rating}/5`
            : "N/A"}
        </b>
      </span>

      <div style={styles.reviewContent}>
        {target.content ||
          target.comment ||
          "No review content."}
      </div>

      <span style={styles.muted}>
        Review date:{" "}
        {formatDate(target.createdAt)}
      </span>
    </div>
  );
}

function BoardingHouseTarget({ target }) {
  if (!target) {
    return (
      <div style={styles.deletedTarget}>
        This boarding house was deleted or no
        longer exists.
      </div>
    );
  }

  const boardingHouseType =
    target.boardingHouseType ||
    target.boardingHouseTypeId;

  const owner =
    target.ownerId || target.owner;

  return (
    <div style={styles.targetBox}>
      <strong style={styles.targetTitle}>
        {target.name ||
          "Unknown boarding house"}
      </strong>

      <span>
        Type:{" "}
        <b>
          {boardingHouseType?.name ||
            boardingHouseType?.typeName ||
            "N/A"}
        </b>
      </span>

      <span>
        Owner:{" "}
        <b>
          {owner?.fullname ||
            owner?.username ||
            "N/A"}
        </b>
      </span>

      <span>
        Address:{" "}
        <b>{formatAddress(target.address)}</b>
      </span>

      <div style={styles.reviewContent}>
        {target.description ||
          "No boarding house description."}
      </div>
    </div>
  );
}

function DetailItem({ label, value }) {
  const hasValue =
    value !== undefined &&
    value !== null &&
    value !== "";

  return (
    <div style={styles.detailItem}>
      <span style={styles.detailLabel}>
        {label}
      </span>

      <div style={styles.detailValue}>
        {hasValue ? value : "N/A"}
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h3 style={styles.sectionTitle}>
        {title}
      </h3>

      {children}
    </section>
  );
}

function ImageGallery({
  title,
  images = [],
}) {
  const validImages = Array.isArray(images)
    ? images.filter((image) =>
        getImageUrl(image),
      )
    : [];

  if (validImages.length === 0) {
    return null;
  }

  return (
    <Section title={title}>
      <div style={styles.imageGrid}>
        {validImages.map((image, index) => {
          const imageUrl = getImageUrl(image);

          return (
            <a
              key={
                image?._id ||
                image?.publicId ||
                imageUrl ||
                index
              }
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
            >
              <img
                src={imageUrl}
                alt={`${title} ${index + 1}`}
                style={styles.image}
              />
            </a>
          );
        })}
      </div>
    </Section>
  );
}

const getImageUrl = (image) => {
  if (!image) {
    return "";
  }

  if (typeof image === "string") {
    return image;
  }

  return (
    image.imageUrl ||
    image.url ||
    image.secure_url ||
    ""
  );
};

const formatType = (type) => {
  if (type === "boardingHouse") {
    return "Boarding House";
  }

  if (type === "review") {
    return "Review";
  }

  return type || "N/A";
};

const formatDate = (value) => {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return date.toLocaleString("vi-VN");
};

const getLocationName = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object") {
    return (
      value.name ||
      value.fullName ||
      value.full_name ||
      value.label ||
      value.title ||
      ""
    );
  }

  return String(value);
};

const formatAddress = (address) => {
  if (!address) {
    return "N/A";
  }

  if (typeof address === "string") {
    return address;
  }

  return (
    [
      getLocationName(address.detail),
      getLocationName(address.ward),
      getLocationName(address.district),
      getLocationName(address.province),
    ]
      .filter(Boolean)
      .join(", ") || "N/A"
  );
};

const getPageButtonStyle = (disabled) => ({
  padding: "8px 14px",
  borderRadius: 8,
  border: "1px solid #d0d5dd",
  background: disabled ? "#f2f4f7" : "#fff",
  color: disabled ? "#98a2b3" : "#344054",
  cursor: disabled ? "not-allowed" : "pointer",
  fontWeight: 700,
});

const styles = {
  page: {
    display: "flex",
    gap: 24,
    maxWidth: 1200,
    margin: "32px auto",
    padding: "0 24px",
    alignItems: "flex-start",
  },

  content: {
    flex: 1,
    minWidth: 0,
    background: "#fff",
    borderRadius: 16,
    padding: 28,
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    flexWrap: "wrap",
    marginBottom: 22,
  },

  title: {
    margin: 0,
    fontSize: 28,
    color: "#222",
  },

  subtitle: {
    margin: "8px 0 0",
    color: "#666",
    fontSize: 14,
    lineHeight: 1.5,
  },

  summary: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 14px",
    color: "#344054",
    fontWeight: 700,
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    background: "#f8fafc",
  },

  tableCard: {
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    overflow: "hidden",
    background: "#fff",
  },

  tableScroll: {
    width: "100%",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    minWidth: 760,
    borderCollapse: "collapse",
  },

  tableHeaderRow: {
    background: "#f8fafc",
    borderBottom: "1px solid #e5e7eb",
  },

  tableRow: {
    borderBottom: "1px solid #f1f5f9",
  },

  th: {
    padding: "15px 14px",
    textAlign: "left",
    color: "#344054",
    fontSize: 13,
    fontWeight: 700,
    whiteSpace: "nowrap",
  },

  td: {
    padding: "15px 14px",
    color: "#344054",
    fontSize: 14,
    verticalAlign: "middle",
  },

  ellipsis: {
    display: "block",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },

  detailButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    border: "none",
    borderRadius: 7,
    padding: "8px 11px",
    background: "#1677ff",
    color: "#fff",
    fontWeight: 600,
  },

  empty: {
    padding: 40,
    textAlign: "center",
    color: "#667085",
  },

  error: {
    padding: 40,
    textAlign: "center",
    color: "#b42318",
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    border: "1px solid",
    borderRadius: 999,
    padding: "4px 9px",
    fontSize: 12,
    fontWeight: 700,
    textTransform: "capitalize",
  },

  pagination: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 14,
    padding: "14px 16px",
    borderTop: "1px solid #e5e7eb",
    flexWrap: "wrap",
  },

  paginationInfo: {
    color: "#667085",
    fontSize: 13,
  },

  paginationActions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },

  pageText: {
    minWidth: 55,
    textAlign: "center",
    color: "#344054",
    fontWeight: 700,
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    background: "rgba(15, 23, 42, 0.55)",
  },

  modal: {
    width: "100%",
    maxWidth: 820,
    maxHeight: "90vh",
    overflowY: "auto",
    padding: 24,
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 20,
  },

  modalTitle: {
    margin: 0,
    color: "#222",
    fontSize: 24,
  },

  modalSubtitle: {
    margin: "6px 0 0",
    color: "#667085",
    fontSize: 13,
  },

  closeButton: {
    width: 36,
    height: 36,
    flexShrink: 0,
    border: "1px solid #d0d5dd",
    borderRadius: 8,
    background: "#fff",
    color: "#344054",
    fontSize: 22,
    cursor: "pointer",
  },

  detailGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
  },

  detailItem: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    padding: 13,
    background: "#f8fafc",
    border: "1px solid #f1f5f9",
    borderRadius: 10,
  },

  detailLabel: {
    color: "#667085",
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
  },

  detailValue: {
    color: "#344054",
    fontWeight: 600,
    overflowWrap: "anywhere",
  },

  sectionTitle: {
    margin: "22px 0 10px",
    color: "#27364a",
    fontSize: 17,
  },

  paragraphBox: {
    margin: 0,
    padding: 14,
    color: "#344054",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
  },

  targetBox: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: 15,
    color: "#344054",
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
  },

  targetTitle: {
    color: "#222",
    fontSize: 17,
  },

  reviewContent: {
    marginTop: 4,
    padding: 12,
    color: "#475467",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
  },

  muted: {
    color: "#667085",
    fontSize: 13,
  },

  deletedTarget: {
    padding: 14,
    color: "#b54708",
    background: "#fffaeb",
    border: "1px solid #fedf89",
    borderRadius: 10,
  },

  imageGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fill, minmax(130px, 1fr))",
    gap: 10,
  },

  image: {
    width: "100%",
    aspectRatio: "1 / 1",
    objectFit: "cover",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
  },

  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: 24,
  },

  modalCloseButton: {
    padding: "10px 20px",
    border: "none",
    borderRadius: 8,
    color: "#fff",
    background: "#ff6b00",
    fontWeight: 700,
    cursor: "pointer",
  },
};