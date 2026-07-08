import { useEffect, useState } from "react";
import {
  getManagedRefundRequests,
  rejectRefundRequest,
  payRefundRequest,
} from "../../api/refundRequest";
import AdminLayout from "../layout/admin/AdminLayout";
const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const getLocationName = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;

  if (typeof value === "object") {
    return (
      value.name ||
      value.fullName ||
      value.full_name ||
      value.label ||
      value.title ||
      Object.values(value)
        .filter((v) => typeof v === "string")
        .join(" ")
    );
  }

  return String(value);
};

const formatAddress = (address) => {
  if (!address) return "N/A";
  if (typeof address === "string") return address;

  return [
    getLocationName(address.detail),
    getLocationName(address.ward),
    getLocationName(address.district),
    getLocationName(address.province),
  ]
    .filter(Boolean)
    .join(", ") || "N/A";
};

export default function ManagedRefundRequestsPage() {
  const [refunds, setRefunds] = useState([]);
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(false);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);

  const [rejectReason, setRejectReason] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("ZaloPay");
  const [damageAssessment, setDamageAssessment] = useState([
    { damageName: "", estimatedCost: 0 },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const loadRefunds = async () => {
    try {
      setLoading(true);
      const res = await getManagedRefundRequests(status);
      setRefunds(res?.data || []);
    } catch (error) {
      alert(error.message || "Load refund requests failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRefunds();
  }, [status]);

  const openRejectModal = (refund) => {
    setSelectedRefund(refund);
    setRejectReason("");
    setRejectOpen(true);
  };

  const openPayModal = (refund) => {
    setSelectedRefund(refund);
    setPaymentMethod("ZaloPay");
    setDamageAssessment([{ damageName: "", estimatedCost: 0 }]);
    setPayOpen(true);
  };

  const closeModals = () => {
    setRejectOpen(false);
    setPayOpen(false);
    setSelectedRefund(null);
    setRejectReason("");
    setDamageAssessment([{ damageName: "", estimatedCost: 0 }]);
  };

  const submitReject = async () => {
    try {
      if (!rejectReason.trim()) {
        alert("Please enter reject reason");
        return;
      }

      setSubmitting(true);

      await rejectRefundRequest(selectedRefund._id, rejectReason.trim());

      alert("Refund request rejected successfully");
      closeModals();
      loadRefunds();
    } catch (error) {
      alert(error.message || "Reject refund request failed");
    } finally {
      setSubmitting(false);
    }
  };

  const updateDamage = (index, field, value) => {
    setDamageAssessment((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              [field]: field === "estimatedCost" ? Number(value) : value,
            }
          : item
      )
    );
  };

  const addDamageRow = () => {
    setDamageAssessment((prev) => [
      ...prev,
      { damageName: "", estimatedCost: 0 },
    ]);
  };

  const removeDamageRow = (index) => {
    setDamageAssessment((prev) => prev.filter((_, i) => i !== index));
  };

  const getTotalDamage = () => {
    return damageAssessment.reduce(
      (sum, item) => sum + Number(item.estimatedCost || 0),
      0
    );
  };

  const getActualRefundAmount = () => {
    return Math.max(
      0,
      Number(selectedRefund?.originalDepositAmount || 0) - getTotalDamage()
    );
  };

  const submitPayRefund = async () => {
    try {
      if (!paymentMethod) {
        alert("Please select payment method");
        return;
      }

      if (getActualRefundAmount() <= 0) {
        alert("Actual refund amount must be greater than 0");
        return;
      }

      setSubmitting(true);

      const cleanDamages = damageAssessment
        .filter((item) => item.damageName || item.estimatedCost)
        .map((item) => ({
          damageName: String(item.damageName || "").trim(),
          estimatedCost: Number(item.estimatedCost || 0),
        }));

      const res = await payRefundRequest(
        selectedRefund._id,
        paymentMethod,
        cleanDamages
      );

      const paymentUrl = res?.data?.paymentUrl || res?.data?.payUrl;

      if (!paymentUrl) {
        alert("Payment URL not found");
        return;
      }

      window.location.href = paymentUrl;
    } catch (error) {
      alert(error.message || "Create refund payment failed");
    } finally {
      setSubmitting(false);
    }
  };

 return (
    <AdminLayout>
        <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Refund Requests</h1>
          <p style={styles.subtitle}>
            View, reject, or process deposit refund requests from tenants.
          </p>
        </div>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={styles.filter}
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div style={styles.emptyBox}>Loading...</div>
      ) : refunds.length === 0 ? (
        <div style={styles.emptyBox}>No refund request found.</div>
      ) : (
        <div style={styles.list}>
          {refunds.map((item) => {
            const itemStatus = String(item.status || "").toLowerCase();
            const canProcess = itemStatus === "pending";

            return (
              <div key={item._id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div>
                    <h2 style={styles.roomTitle}>
                      Room {item.room?.roomNumber || "N/A"}
                    </h2>
                    <p>
                      Boarding house:{" "}
                      <b>{item.boardingHouse?.name || "N/A"}</b>
                    </p>
                    <p>
                      Address:{" "}
                      <b>{formatAddress(item.boardingHouse?.address)}</b>
                    </p>
                  </div>

                  <span
                    style={{
                      ...styles.statusBadge,
                      background:
                        itemStatus === "pending"
                          ? "#fff7ed"
                          : itemStatus === "accepted"
                          ? "#dcfce7"
                          : "#fee2e2",
                      color:
                        itemStatus === "pending"
                          ? "#c2410c"
                          : itemStatus === "accepted"
                          ? "#15803d"
                          : "#b91c1c",
                    }}
                  >
                    {item.status}
                  </span>
                </div>

                <div style={styles.infoGrid}>
                  <Info label="Tenant" value={item.user?.fullname || "N/A"} />
                  <Info label="Email" value={item.user?.email || "N/A"} />
                  <Info
                    label="Phone"
                    value={item.user?.phoneNumber || "N/A"}
                  />
                  <Info
                    label="Original deposit"
                    value={formatCurrency(item.originalDepositAmount)}
                  />
                  <Info
                    label="Damage cost"
                    value={formatCurrency(item.totalDamageAmount)}
                  />
                  <Info
                    label="Actual refund"
                    value={formatCurrency(item.actualRefundAmount)}
                  />
                </div>

                <div style={styles.section}>
                  <h3 style={styles.sectionTitle}>User Refund Reason</h3>
                  <pre style={styles.reasonBox}>{item.reason || "N/A"}</pre>
                </div>

                {item.damageAssessment?.length > 0 && (
                  <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>Damage Assessment</h3>
                    {item.damageAssessment.map((damage, index) => (
                      <div key={index} style={styles.damageItem}>
                        <span>{damage.damageName || "N/A"}</span>
                        <b>{formatCurrency(damage.estimatedCost)}</b>
                      </div>
                    ))}
                  </div>
                )}

                {item.reasonForCancel && (
                  <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>Reject Reason</h3>
                    <div style={styles.rejectBox}>{item.reasonForCancel}</div>
                  </div>
                )}

                <div style={styles.meta}>
                  <span>Created at: {item.createdAt || "N/A"}</span>
                  <span>Processed at: {item.processedAt || "N/A"}</span>
                  <span>
                    Processed by:{" "}
                    {item.processedBy?.fullname ||
                      item.processedBy?.email ||
                      "Not processed yet"}
                  </span>
                </div>

                {canProcess && (
                  <div style={styles.actions}>
                    <button
                      type="button"
                      onClick={() => openRejectModal(item)}
                      style={styles.rejectBtn}
                    >
                      Reject
                    </button>

                    <button
                      type="button"
                      onClick={() => openPayModal(item)}
                      style={styles.payBtn}
                    >
                      Accept / Pay Refund
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
            <h2>Reject Refund Request</h2>

            <p>
              Room: <b>{selectedRefund?.room?.roomNumber || "N/A"}</b>
            </p>

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
                onClick={closeModals}
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

      {payOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2>Accept / Pay Refund</h2>

            <div style={styles.refundSummary}>
              <p>
                Room: <b>{selectedRefund?.room?.roomNumber || "N/A"}</b>
              </p>
              <p>
                Original deposit:{" "}
                <b>{formatCurrency(selectedRefund?.originalDepositAmount)}</b>
              </p>
              <p>
                Total damage: <b>{formatCurrency(getTotalDamage())}</b>
              </p>
              <p>
                Actual refund:{" "}
                <b style={{ color: "green" }}>
                  {formatCurrency(getActualRefundAmount())}
                </b>
              </p>
            </div>

            <label style={styles.label}>Damage Assessment</label>

            {damageAssessment.map((item, index) => (
              <div key={index} style={styles.damageRow}>
                <input
                  value={item.damageName}
                  onChange={(e) =>
                    updateDamage(index, "damageName", e.target.value)
                  }
                  placeholder="Damage name"
                  style={styles.input}
                />

                <input
                  type="number"
                  value={item.estimatedCost}
                  onChange={(e) =>
                    updateDamage(index, "estimatedCost", e.target.value)
                  }
                  placeholder="Cost"
                  style={styles.input}
                />

                {damageAssessment.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDamageRow(index)}
                    style={styles.smallRejectBtn}
                  >
                    X
                  </button>
                )}
              </div>
            ))}

            <button type="button" onClick={addDamageRow} style={styles.addBtn}>
              + Add Damage
            </button>

            <label style={styles.label}>Payment Method *</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={styles.select}
            >
              <option value="ZaloPay">ZaloPay</option>
              <option value="VNPay">VNPay</option>
            </select>

            <div style={styles.warningBox}>
              After payment success, refund request will become accepted and
              deposit will become refunded.
            </div>

            <div style={styles.modalActions}>
              <button
                type="button"
                onClick={closeModals}
                disabled={submitting}
                style={styles.cancelBtn}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={submitPayRefund}
                disabled={submitting}
                style={styles.payBtn}
              >
                {submitting ? "Processing..." : "Pay Refund"}
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
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

const styles = {
  page: {
    padding: 24,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    margin: 0,
    fontSize: 28,
  },
  subtitle: {
    color: "#666",
    marginTop: 6,
  },
  filter: {
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #ddd",
    minWidth: 160,
  },
  list: {
    display: "grid",
    gap: 18,
  },
  card: {
    background: "#fff",
    borderRadius: 14,
    border: "1px solid #eee",
    padding: 22,
    boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
  },
  roomTitle: {
    marginTop: 0,
  },
  statusBadge: {
    padding: "8px 14px",
    borderRadius: 999,
    height: "fit-content",
    fontWeight: 700,
    textTransform: "capitalize",
  },
  infoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
    marginTop: 16,
  },
  infoBox: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: 12,
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    margin: "0 0 8px",
    fontSize: 16,
  },
  reasonBox: {
    whiteSpace: "pre-wrap",
    fontFamily: "inherit",
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: 14,
    lineHeight: 1.6,
  },
  rejectBox: {
    background: "#fee2e2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: 10,
    padding: 14,
    fontWeight: 600,
  },
  damageItem: {
    display: "flex",
    justifyContent: "space-between",
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  meta: {
    display: "grid",
    gap: 6,
    marginTop: 18,
    color: "#666",
    fontSize: 14,
  },
  actions: {
    display: "flex",
    gap: 12,
    marginTop: 18,
  },
  rejectBtn: {
    border: "none",
    background: "#dc2626",
    color: "#fff",
    borderRadius: 8,
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 700,
  },
  payBtn: {
    border: "none",
    background: "#ff6b00",
    color: "#fff",
    borderRadius: 8,
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 700,
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
    maxWidth: 650,
    maxHeight: "90vh",
    overflowY: "auto",
    background: "#fff",
    borderRadius: 16,
    padding: 24,
  },
  label: {
    display: "block",
    fontWeight: 700,
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
  input: {
    flex: 1,
    border: "1px solid #ddd",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  select: {
    width: "100%",
    border: "1px solid #ddd",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    boxSizing: "border-box",
  },
  damageRow: {
    display: "flex",
    gap: 10,
    marginBottom: 10,
  },
  smallRejectBtn: {
    border: "none",
    background: "#dc2626",
    color: "#fff",
    borderRadius: 8,
    padding: "0 12px",
    cursor: "pointer",
    fontWeight: 700,
  },
  addBtn: {
    border: "1px solid #ff6b00",
    background: "#fff7ed",
    color: "#ff6b00",
    borderRadius: 8,
    padding: "9px 14px",
    cursor: "pointer",
    fontWeight: 700,
  },
  refundSummary: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 14,
  },
  warningBox: {
    background: "#fff7ed",
    color: "#c2410c",
    border: "1px solid #fed7aa",
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
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
    fontWeight: 700,
  },
};