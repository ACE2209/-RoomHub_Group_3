import { useEffect, useState } from "react";
import {
  getManagedRenewalRequests,
  decideRenewalRequest,
} from "../../api/renewalRequestAPI";
import { getOwnBoardingHouses } from "../../api/boardingHouse";
import AdminLayout from "../layout/admin/AdminLayout";

const formatDate = (value) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString("vi-VN");
};

export default function ManagedRenewalRequestsPage() {
  const [boardingHouses, setBoardingHouses] = useState([]);
  const [renewalRequests, setRenewalRequests] = useState([]);
  const [status, setStatus] = useState("");
  const [selectedBoardingHouse, setSelectedBoardingHouse] = useState("");
  const [loading, setLoading] = useState(false);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadBoardingHouses = async () => {
    try {
      const res = await getOwnBoardingHouses({ page: 1, limit: 100 });
      setBoardingHouses(res?.data || []);
    } catch (error) {
      alert(error.message || "Load boarding houses failed");
    }
  };

  const loadRenewalRequests = async () => {
    try {
      setLoading(true);

      const res = await getManagedRenewalRequests({
        status,
        boardingHouseId: selectedBoardingHouse,
        limit: 100,
      });

      setRenewalRequests(res?.data || []);
    } catch (error) {
      alert(error.message || "Load renewal requests failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoardingHouses();
  }, []);

  useEffect(() => {
    loadRenewalRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, selectedBoardingHouse]);

  const handleAccept = async (request) => {
    const confirmed = window.confirm(
      `Accept this renewal request? The rental end date will be extended to ${formatDate(
        request.requestedEndDate
      )}.`
    );

    if (!confirmed) return;

    try {
      setSubmitting(true);
      await decideRenewalRequest(request._id, "accepted");

      alert("Renewal request accepted successfully");
      loadRenewalRequests();
    } catch (error) {
      alert(error.message || "Accept renewal request failed");
    } finally {
      setSubmitting(false);
    }
  };

  const openRejectModal = (request) => {
    setSelectedRequest(request);
    setRejectReason("");
    setRejectOpen(true);
  };

  const closeRejectModal = () => {
    setRejectOpen(false);
    setSelectedRequest(null);
    setRejectReason("");
  };

  const submitReject = async () => {
    try {
      if (!rejectReason.trim()) {
        alert("Please enter reject reason");
        return;
      }

      setSubmitting(true);
      await decideRenewalRequest(
        selectedRequest._id,
        "rejected",
        rejectReason.trim()
      );

      alert("Renewal request rejected successfully");
      closeRejectModal();
      loadRenewalRequests();
    } catch (error) {
      alert(error.message || "Reject renewal request failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div style={styles.page}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Renewal Requests</h1>
            <p style={styles.subtitle}>
              Review and process rental renewal requests from tenants.
            </p>
          </div>

          <div style={styles.summaryBox}>
            {renewalRequests.length} request(s)
          </div>
        </div>

        <div style={styles.filterRow}>
          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>Boarding House</label>
            <select
              value={selectedBoardingHouse}
              onChange={(e) => setSelectedBoardingHouse(e.target.value)}
              style={styles.filter}
            >
              <option value="">All Boarding Houses</option>
              {boardingHouses.map((bh) => (
                <option key={bh._id} value={bh._id}>
                  {bh.name || "N/A"}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={styles.filter}
            >
              <option value="">All Status</option>
              <option value="pending">Pending - Need Processing</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={styles.emptyBox}>Loading...</div>
        ) : renewalRequests.length === 0 ? (
          <div style={styles.emptyBox}>No renewal request found.</div>
        ) : (
          <div style={styles.list}>
            {renewalRequests.map((item) => {
              const itemStatus = String(item.status || "").toLowerCase();
              const canProcess = itemStatus === "pending";

              return (
                <div key={item._id} style={styles.card}>
                  <div style={styles.cardTop}>
                    <div>
                      <div style={styles.roomLine}>
                        Room {item.roomId?.roomNumber || "N/A"} ·{" "}
                        {item.roomId?.boardingHouseId?.name || "N/A"}
                      </div>

                      <div style={styles.tenantLine}>
                        Tenant: {item.accountId?.fullname || "N/A"} (
                        {item.accountId?.email || "N/A"})
                      </div>
                    </div>

                    <span style={getStatusStyle(itemStatus)}>
                      {item.status}
                    </span>
                  </div>

                  <div style={styles.compactGrid}>
                    <Info
                      label="Current end date"
                      value={formatDate(item.currentEndDate)}
                    />
                    <Info
                      label="Requested end date"
                      value={formatDate(item.requestedEndDate)}
                    />
                    <Info label="Created" value={formatDate(item.createdAt)} />
                  </div>

                  {item.tenantNote && (
                    <div style={styles.section}>
                      <h3 style={styles.sectionTitle}>Tenant Note</h3>
                      <pre style={styles.noteBox}>{item.tenantNote}</pre>
                    </div>
                  )}

                  {itemStatus === "rejected" && item.reasonForCancel && (
                    <div style={styles.section}>
                      <h3 style={styles.sectionTitle}>Reject Reason</h3>
                      <div style={styles.rejectBox}>
                        {item.reasonForCancel}
                      </div>
                    </div>
                  )}

                  {canProcess && (
                    <div style={styles.actions}>
                      <button
                        type="button"
                        onClick={() => openRejectModal(item)}
                        disabled={submitting}
                        style={styles.rejectBtn}
                      >
                        Reject
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAccept(item)}
                        disabled={submitting}
                        style={styles.acceptBtn}
                      >
                        Accept
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {rejectOpen && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <h2 style={styles.modalTitle}>Reject Renewal Request</h2>

              <div style={styles.compactInfoGrid}>
                <Info
                  label="Tenant"
                  value={selectedRequest?.accountId?.fullname || "N/A"}
                />
                <Info
                  label="Room"
                  value={selectedRequest?.roomId?.roomNumber || "N/A"}
                />
              </div>

              <label style={styles.label}>Reject Reason *</label>
              <textarea
                rows={5}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reject reason..."
                style={styles.textarea}
              />

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={closeRejectModal}
                  disabled={submitting}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={submitReject}
                  disabled={submitting}
                  style={styles.rejectBtn}
                >
                  {submitting ? "Submitting..." : "Reject"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function Info({ label, value }) {
  return (
    <div style={styles.infoBox}>
      <span style={styles.infoLabel}>{label}</span>
      <b style={styles.infoValue}>{value}</b>
    </div>
  );
}

const getStatusStyle = (status) => ({
  ...styles.statusBadge,
  background:
    status === "pending"
      ? "#fff7ed"
      : status === "accepted"
      ? "#dcfce7"
      : "#fee2e2",
  color:
    status === "pending"
      ? "#c2410c"
      : status === "accepted"
      ? "#15803d"
      : "#b91c1c",
});

const styles = {
  page: {
    padding: 24,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "center",
    marginBottom: 18,
  },
  title: {
    margin: 0,
    fontSize: 28,
    color: "#27364a",
  },
  subtitle: {
    color: "#667085",
    marginTop: 6,
  },
  summaryBox: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: "10px 14px",
    fontWeight: 700,
    color: "#344054",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  },
  filterRow: {
    display: "grid",
    gridTemplateColumns: "1.2fr 220px",
    gap: 16,
    marginBottom: 22,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 18,
    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
  },
  filterItem: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  filterLabel: {
    fontSize: 12,
    color: "#667085",
    fontWeight: 800,
    textTransform: "uppercase",
  },
  filter: {
    height: 42,
    borderRadius: 8,
    border: "1px solid #d0d5dd",
    padding: "0 12px",
    color: "#344054",
    background: "#fff",
  },
  list: {
    display: "grid",
    gap: 18,
  },
  card: {
    background: "#fff",
    borderRadius: 16,
    border: "1px solid #e5e7eb",
    padding: 22,
    boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
    alignItems: "flex-start",
    marginBottom: 14,
  },
  roomLine: {
    fontSize: 18,
    fontWeight: 800,
    color: "#27364a",
  },
  tenantLine: {
    marginTop: 4,
    color: "#667085",
    fontSize: 13,
  },
  compactGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
    marginTop: 16,
  },
  infoBox: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 14,
    minHeight: 64,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  infoLabel: {
    fontSize: 12,
    color: "#667085",
    fontWeight: 800,
    textTransform: "uppercase",
  },
  infoValue: {
    color: "#27364a",
    fontSize: 14,
    wordBreak: "break-word",
  },
  section: {
    marginTop: 14,
  },
  sectionTitle: {
    margin: "0 0 8px",
    fontSize: 15,
  },
  noteBox: {
    whiteSpace: "pre-wrap",
    fontFamily: "inherit",
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: 12,
    lineHeight: 1.5,
    margin: 0,
  },
  rejectBox: {
    background: "#fee2e2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: 10,
    padding: 12,
    fontWeight: 600,
  },
  statusBadge: {
    padding: "7px 12px",
    borderRadius: 999,
    height: "fit-content",
    fontWeight: 800,
    textTransform: "capitalize",
    whiteSpace: "nowrap",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 14,
  },
  rejectBtn: {
    border: "none",
    background: "#dc2626",
    color: "#fff",
    borderRadius: 8,
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 800,
  },
  acceptBtn: {
    border: "none",
    background: "#16a34a",
    color: "#fff",
    borderRadius: 8,
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 800,
  },
  emptyBox: {
    background: "#fff",
    border: "1px dashed #ddd",
    borderRadius: 12,
    padding: 24,
    color: "#777",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modal: {
    width: "100%",
    maxWidth: 520,
    background: "#fff",
    borderRadius: 16,
    padding: 22,
  },
  modalTitle: {
    marginTop: 0,
    marginBottom: 14,
    color: "#27364a",
  },
  compactInfoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 10,
    marginTop: 12,
  },
  label: {
    display: "block",
    fontWeight: 800,
    marginBottom: 8,
    marginTop: 14,
  },
  textarea: {
    width: "100%",
    border: "1px solid #ddd",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    boxSizing: "border-box",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 18,
  },
  cancelBtn: {
    border: "1px solid #ddd",
    background: "#fff",
    borderRadius: 8,
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 800,
  },
};
