import { useEffect, useState } from "react";
import {
  getManagedRefundRequests,
  rejectRefundRequest,
  payRefundRequest,
} from "../../api/refundRequest";
import { getOwnBoardingHouses } from "../../api/boardingHouse";
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
  const [boardingHouses, setBoardingHouses] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [status, setStatus] = useState("all");
  const [selectedBoardingHouse, setSelectedBoardingHouse] = useState("all");
  const [selectedRoom, setSelectedRoom] = useState("all");
  const [loading, setLoading] = useState(false);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);

  const [rejectReason, setRejectReason] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("ZaloPay");
  const [damageAssessment, setDamageAssessment] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const loadBoardingHouses = async () => {
    try {
      const res = await getOwnBoardingHouses({ page: 1, limit: 100 });
      setBoardingHouses(res?.data || []);
    } catch (error) {
      alert(error.message || "Load boarding houses failed");
    }
  };

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
    loadBoardingHouses();
  }, []);

  useEffect(() => {
    loadRefunds();
  }, [status]);

  const roomOptions = Array.from(
    new Map(
      refunds
        .filter((item) => {
          if (selectedBoardingHouse === "all") return true;
          return item.boardingHouse?._id === selectedBoardingHouse;
        })
        .filter((item) => item.room?._id)
        .map((item) => [item.room._id, item.room])
    ).values()
  );

  const filteredRefunds = refunds
    .filter((item) => {
      const matchBoardingHouse =
        selectedBoardingHouse === "all" ||
        item.boardingHouse?._id === selectedBoardingHouse;

      const matchRoom =
        selectedRoom === "all" || item.room?._id === selectedRoom;

      return matchBoardingHouse && matchRoom;
    })
    .sort((a, b) => {
      const priority = {
        pending: 1,
        accepted: 2,
        rejected: 3,
      };

      return (
        (priority[String(a.status || "").toLowerCase()] || 99) -
        (priority[String(b.status || "").toLowerCase()] || 99)
      );
    });

  const openRejectModal = (refund) => {
    setSelectedRefund(refund);
    setRejectReason("");
    setRejectOpen(true);
  };

  const openPayModal = (refund) => {
    setSelectedRefund(refund);
    setPaymentMethod("ZaloPay");
    setDamageAssessment([]);
    setPayOpen(true);
  };

  const closeModals = () => {
    setRejectOpen(false);
    setPayOpen(false);
    setSelectedRefund(null);
    setRejectReason("");
    setDamageAssessment([]);
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
              Manage deposit refund requests and process deductions if needed.
            </p>
          </div>

          <div style={styles.summaryBox}>
            {filteredRefunds.length} request(s)
          </div>
        </div>

        <div style={styles.filterRow}>
          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>Boarding House</label>
            <select
              value={selectedBoardingHouse}
              onChange={(e) => {
                setSelectedBoardingHouse(e.target.value);
                setSelectedRoom("all");
              }}
              style={styles.filter}
            >
              <option value="all">All Boarding Houses</option>
              {boardingHouses.map((bh) => (
                <option key={bh._id} value={bh._id}>
                  {bh.name || bh.boardingHouseName || "N/A"}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>Room</label>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              style={styles.filter}
            >
              <option value="all">All Rooms</option>
              {roomOptions.map((room) => (
                <option key={room._id} value={room._id}>
                  Room {room.roomNumber || "N/A"}
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
              <option value="all">All Status</option>
              <option value="pending">Pending - Need Processing</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={styles.emptyBox}>Loading...</div>
        ) : filteredRefunds.length === 0 ? (
          <div style={styles.emptyBox}>No refund request found.</div>
        ) : (
          <div style={styles.list}>
            {filteredRefunds.map((item) => {
              const itemStatus = String(item.status || "").toLowerCase();
              const canProcess = itemStatus === "pending";

              return (
                <div key={item._id} style={styles.card}>
                  <div style={styles.cardTop}>
                    <div>
                      <div style={styles.roomLine}>
                        Room {item.room?.roomNumber || "N/A"} ·{" "}
                        {item.boardingHouse?.name || "N/A"}
                      </div>

                      <div style={styles.addressLine}>
                        {formatAddress(item.boardingHouse?.address)}
                      </div>
                    </div>

                    <span style={getStatusStyle(itemStatus)}>
                      {item.status}
                    </span>
                  </div>

                  <div style={styles.compactGrid}>
                    <Info label="Tenant" value={item.user?.fullname || "N/A"} />
                    <Info label="Phone" value={item.user?.phoneNumber || "N/A"} />
                    <Info
                      label="Deposit"
                      value={formatCurrency(item.originalDepositAmount)}
                    />
                    <Info
                      label="Damage"
                      value={formatCurrency(item.totalDamageAmount)}
                    />
                    <Info
                      label="Refund"
                      value={formatCurrency(item.actualRefundAmount)}
                    />
                    <Info label="Created" value={item.createdAt || "N/A"} />
                  </div>

                  <details style={styles.detailsBox}>
                    <summary style={styles.summaryText}>
                      View reason and processing detail
                    </summary>

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
                        <div style={styles.rejectBox}>
                          {item.reasonForCancel}
                        </div>
                      </div>
                    )}

                    <div style={styles.meta}>
                      <span>Processed at: {item.processedAt || "N/A"}</span>
                      <span>
                        Processed by:{" "}
                        {item.processedBy?.fullname ||
                          item.processedBy?.email ||
                          "Not processed yet"}
                      </span>
                    </div>
                  </details>

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
            <div style={styles.modalSmall}>
              <h2 style={styles.modalTitle}>Reject Refund Request</h2>

              <div style={styles.compactInfoGrid}>
                <Info
                  label="Tenant"
                  value={selectedRefund?.user?.fullname || "N/A"}
                />
                <Info
                  label="Room"
                  value={selectedRefund?.room?.roomNumber || "N/A"}
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
              <h2 style={styles.modalTitle}>Accept / Pay Refund</h2>

              <div style={styles.compactInfoGrid}>
                <Info
                  label="Tenant"
                  value={selectedRefund?.user?.fullname || "N/A"}
                />
                <Info
                  label="Phone"
                  value={selectedRefund?.user?.phoneNumber || "N/A"}
                />
                <Info
                  label="Boarding House"
                  value={selectedRefund?.boardingHouse?.name || "N/A"}
                />
                <Info
                  label="Room"
                  value={selectedRefund?.room?.roomNumber || "N/A"}
                />
              </div>

              <div style={styles.refundSummaryCompact}>
                <div>
                  <span>Original Deposit</span>
                  <b>{formatCurrency(selectedRefund?.originalDepositAmount)}</b>
                </div>

                <div>
                  <span>Total Damage</span>
                  <b>{formatCurrency(getTotalDamage())}</b>
                </div>

                <div>
                  <span>Actual Refund</span>
                  <b style={{ color: "green" }}>
                    {formatCurrency(getActualRefundAmount())}
                  </b>
                </div>
              </div>

              <label style={styles.label}>Damage Assessment</label>

              {damageAssessment.length === 0 && (
                <div style={styles.noDamageBox}>
                  No damage added. User will receive full deposit refund.
                </div>
              )}

              <div style={styles.damageTable}>
                {damageAssessment.map((item, index) => (
                  <div key={index} style={styles.damageRowCompact}>
                    <input
                      value={item.damageName}
                      onChange={(e) =>
                        updateDamage(index, "damageName", e.target.value)
                      }
                      placeholder="Damage description"
                      style={styles.damageNameInput}
                    />

                    <input
                      type="number"
                      value={item.estimatedCost}
                      onChange={(e) =>
                        updateDamage(index, "estimatedCost", e.target.value)
                      }
                      placeholder="Cost"
                      style={styles.damageCostInput}
                    />

                    <button
                      type="button"
                      onClick={() => removeDamageRow(index)}
                      style={styles.removeDamageBtn}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

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
                After successful payment, the request will be marked as accepted
                and the deposit will be marked as refunded.
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
    gridTemplateColumns: "1.2fr 1fr 220px",
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
  addressLine: {
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
  reasonBox: {
    whiteSpace: "pre-wrap",
    fontFamily: "inherit",
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: 12,
    lineHeight: 1.5,
    margin: 0,
  },
  detailsBox: {
    marginTop: 14,
    background: "#fff",
  },
  summaryText: {
    cursor: "pointer",
    color: "#2563eb",
    fontWeight: 700,
  },
  statusBadge: {
    padding: "7px 12px",
    borderRadius: 999,
    height: "fit-content",
    fontWeight: 800,
    textTransform: "capitalize",
    whiteSpace: "nowrap",
  },
  damageItem: {
    display: "flex",
    justifyContent: "space-between",
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  rejectBox: {
    background: "#fee2e2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: 10,
    padding: 12,
    fontWeight: 600,
  },
  meta: {
    display: "grid",
    gap: 4,
    marginTop: 12,
    color: "#667085",
    fontSize: 13,
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
  payBtn: {
    border: "none",
    background: "#ff6b00",
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
    maxWidth: 720,
    maxHeight: "86vh",
    overflowY: "auto",
    background: "#fff",
    borderRadius: 16,
    padding: 22,
  },
  modalSmall: {
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
  refundSummaryCompact: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10,
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
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
  damageTable: {
    display: "grid",
    gap: 8,
  },
  damageRowCompact: {
    display: "grid",
    gridTemplateColumns: "1fr 160px 36px",
    gap: 8,
    alignItems: "center",
  },
  damageNameInput: {
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: "9px 10px",
    fontSize: 14,
  },
  damageCostInput: {
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: "9px 10px",
    fontSize: 14,
  },
  removeDamageBtn: {
    border: "none",
    background: "#fee2e2",
    color: "#b91c1c",
    borderRadius: 8,
    height: 38,
    cursor: "pointer",
    fontWeight: 800,
  },
  noDamageBox: {
    background: "#ecfdf3",
    color: "#087443",
    border: "1px solid #abefc6",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    fontWeight: 700,
  },
  addBtn: {
    border: "1px solid #ff6b00",
    background: "#fff7ed",
    color: "#ff6b00",
    borderRadius: 8,
    padding: "9px 14px",
    cursor: "pointer",
    fontWeight: 800,
    marginTop: 10,
  },
  select: {
    width: "100%",
    border: "1px solid #ddd",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    boxSizing: "border-box",
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
    fontWeight: 800,
  },
};