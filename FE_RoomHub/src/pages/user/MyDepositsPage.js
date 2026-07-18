import { useEffect, useState } from "react";
import {
  getMyDeposits,
  payDeposit,
  createRefundRequest,
} from "../../api/deposit";
import { getProfileAPI } from "../../api/accountAPI";
import Header from "../layout/homepage/header";
import Footer from "../layout/homepage/footer";
import ProfileSidebar from "../profile/ProfileSidebar";
import RenewalRequestModal from "../../components/RenewalRequestModal";

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString("vi-VN");
};
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
      ""
    );
  }

  return String(value);
};

const formatAddress = (address) => {
  if (!address) return "N/A";

  if (typeof address === "string") return address;

  if (typeof address === "object") {
    return [
      getLocationName(address.detail),
      getLocationName(address.ward),
      getLocationName(address.district),
      getLocationName(address.province),
    ]
      .filter(Boolean)
      .join(", ") || "N/A";
  }

  return String(address);
};
export default function MyDepositsPage() {
  const [user, setUser] = useState(null);
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState("");

  const [refundOpen, setRefundOpen] = useState(false);
  const [renewalDeposit, setRenewalDeposit] = useState(null);
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [refundReasonType, setRefundReasonType] = useState("");
  const [refundDetail, setRefundDetail] = useState("");
  const [submittingRefund, setSubmittingRefund] = useState(false);

  const loadDeposits = async () => {
    try {
      setLoading(true);
      const profileRes = await getProfileAPI();
      const depositRes = await getMyDeposits();

      setUser(profileRes?.data || profileRes || null);
      setDeposits(depositRes?.data || []);
    } catch (error) {
      alert(error.message || "Load deposits failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeposits();
  }, []);

  const handlePay = async (depositId, method) => {
    try {
      setPaying(`${depositId}-${method}`);

      const res = await payDeposit(depositId, method);
      const paymentUrl = res?.data?.paymentUrl || res?.data?.payUrl;

      if (!paymentUrl) {
        alert("Payment URL not found");
        return;
      }

      window.location.href = paymentUrl;
    } catch (error) {
      alert(error.message || "Payment failed");
    } finally {
      setPaying("");
    }
  };

  const openRefundModal = (deposit) => {
    setSelectedDeposit(deposit);
    setRefundReasonType("");
    setRefundDetail("");
    setRefundOpen(true);
  };

  const closeRefundModal = () => {
    setRefundOpen(false);
    setSelectedDeposit(null);
    setRefundReasonType("");
    setRefundDetail("");
  };

  const submitRefundRequest = async () => {
    try {
      if (!selectedDeposit?._id) {
        alert("Deposit not found");
        return;
      }

      if (!refundReasonType) {
        alert("Please select refund reason");
        return;
      }

      if (!refundDetail.trim()) {
        alert("Please enter detail reason");
        return;
      }

      setSubmittingRefund(true);

      const room = selectedDeposit.roomId;

      const fullReason = `
Refund reason: ${refundReasonType}

Detail:
${refundDetail.trim()}

Deposit information:
- Room: ${room?.roomNumber || "N/A"}
- Boarding house: ${room?.boardingHouseId?.name || "N/A"}
- Room type: ${room?.roomTypeId?.typeName || "N/A"}
- Deposit amount: ${formatCurrency(selectedDeposit.amount)}
- Rental time: ${selectedDeposit.rentalTime || 6} months
- Start date: ${formatDate(selectedDeposit.startDate)}
- End date: ${formatDate(selectedDeposit.endDate)}
`.trim();

      await createRefundRequest({
        depositRoomId: selectedDeposit._id,
        reason: fullReason,
      });

      alert("Refund request created successfully");
      closeRefundModal();
      loadDeposits();
    } catch (error) {
      alert(error.message || "Create refund request failed");
    } finally {
      setSubmittingRefund(false);
    }
  };

  return (
    <>
      <Header />

      <div style={styles.page}>
        <ProfileSidebar user={user} />

        <main style={styles.content}>
          <h1 style={styles.title}>My Deposits</h1>
          <p style={styles.subtitle}>
            Deposit requests must be accepted by owner/staff before payment.
          </p>

          {loading ? (
            <p>Loading...</p>
          ) : deposits.length === 0 ? (
            <div style={styles.emptyBox}>No deposit request found.</div>
          ) : (
            <div style={styles.list}>
              {deposits.map((deposit) => {
                const room = deposit.roomId;
                const status = String(deposit.status || "").toLowerCase();

                const canPay = status === "accepted";
                const isPaid = status === "confirmed";
                const isPending = status === "pending";
                const isRejected = status === "rejected";
                const isRefunded = status === "refunded";

                return (
                  <div key={deposit._id} style={styles.card}>
                    <h3 style={styles.roomTitle}>
                      Room {room?.roomNumber || "N/A"}
                    </h3>

                    <p>
                      Boarding house:{" "}
                      <b>{room?.boardingHouseId?.name || "N/A"}</b>
                    </p>

                    <p>
                      Address:{" "}
                      <b>{formatAddress(room?.boardingHouseId?.address)}</b>
                    </p>

                    <p>
                      Room type: <b>{room?.roomTypeId?.typeName || "N/A"}</b>
                    </p>

                    <p>
                      Monthly price:{" "}
                      <b>{formatCurrency(room?.roomTypeId?.price)}</b>
                    </p>

                    <p>
                      Deposit months:{" "}
                      <b>{deposit.depositMonths || 1} month(s)</b>
                    </p>

                    <p>
                      Deposit amount: <b>{formatCurrency(deposit.amount)}</b>
                    </p>

                    <p>
                      Rental time: <b>{deposit.rentalTime || 6} months</b>
                    </p>

                    <p>
                      Start date: <b>{formatDate(deposit.startDate)}</b>
                    </p>

                    <p>
                      End date: <b>{formatDate(deposit.endDate)}</b>
                    </p>

                    <p>
                      Status:{" "}
                      <b
                        style={{
                          color: canPay
                            ? "#ff6b00"
                            : isPaid
                            ? "green"
                            : isRejected
                            ? "red"
                            : isRefunded
                            ? "#2563eb"
                            : "#666",
                        }}
                      >
                        {deposit.status}
                      </b>
                    </p>

                    {isPending && (
                      <p style={styles.note}>
                        Waiting for owner/staff approval.
                      </p>
                    )}

                    {isRejected && (
                      <p style={styles.reject}>
                        Your deposit request was rejected.
                      </p>
                    )}

                    {isPaid && (
                      <p style={styles.success}>Deposit paid successfully.</p>
                    )}

                    {isRefunded && (
                      <p style={styles.refunded}>
                        Deposit has been refunded.
                      </p>
                    )}

                    {canPay && (
                      <div style={styles.actions}>
                        <button
                          type="button"
                          onClick={() => handlePay(deposit._id, "ZaloPay")}
                          disabled={paying === `${deposit._id}-ZaloPay`}
                          style={styles.zaloPayBtn}
                        >
                          {paying === `${deposit._id}-ZaloPay`
                            ? "Processing..."
                            : "Pay with ZaloPay"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handlePay(deposit._id, "VNPay")}
                          disabled={paying === `${deposit._id}-VNPay`}
                          style={styles.vnpayBtn}
                        >
                          {paying === `${deposit._id}-VNPay`
                            ? "Processing..."
                            : "Pay with VNPay"}
                        </button>
                      </div>
                    )}

                    {isPaid && (
                      <div style={styles.actions}>
                        <button
                          type="button"
                          onClick={() => openRefundModal(deposit)}
                          style={styles.refundBtn}
                        >
                          Request Refund
                        </button>

                        <button
                          type="button"
                          onClick={() => setRenewalDeposit(deposit)}
                          style={styles.renewalBtn}
                        >
                          Request Renewal
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {refundOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalTitle}>Request Deposit Refund</h2>

            <div style={styles.refundInfoBox}>
              <p>
                Room: <b>{selectedDeposit?.roomId?.roomNumber || "N/A"}</b>
              </p>
              <p>
                Boarding house:{" "}
                <b>{selectedDeposit?.roomId?.boardingHouseId?.name || "N/A"}</b>
              </p>
              <p>
                Address:{" "}
                <b>
{formatAddress(selectedDeposit?.roomId?.boardingHouseId?.address)}                </b>
              </p>
              <p>
                Room type:{" "}
                <b>{selectedDeposit?.roomId?.roomTypeId?.typeName || "N/A"}</b>
              </p>
              <p>
                Deposit amount:{" "}
                <b>{formatCurrency(selectedDeposit?.amount)}</b>
              </p>
              <p>
                Rental time:{" "}
                <b>{selectedDeposit?.rentalTime || 6} months</b>
              </p>
              <p>
                Start date: <b>{formatDate(selectedDeposit?.startDate)}</b>
              </p>
              <p>
                End date: <b>{formatDate(selectedDeposit?.endDate)}</b>
              </p>
            </div>

            <label style={styles.label}>Refund Reason *</label>
            <select
              value={refundReasonType}
              onChange={(e) => setRefundReasonType(e.target.value)}
              style={styles.select}
            >
              <option value="">Select refund reason</option>
              <option value="Finished rental period">
                Finished rental period
              </option>
              <option value="No longer want to rent">
                No longer want to rent
              </option>
              <option value="Room information is incorrect">
                Room information is incorrect
              </option>
              <option value="Room condition issue">
                Room condition issue
              </option>
              <option value="Owner or staff agreement">
                Owner or staff agreement
              </option>
              <option value="Other reason">Other reason</option>
            </select>

            <label style={styles.label}>Detail Description *</label>
            <textarea
              rows={5}
              value={refundDetail}
              onChange={(e) => setRefundDetail(e.target.value)}
              placeholder="Describe why you want to request a deposit refund..."
              style={styles.textarea}
            />

            <div style={styles.warningBox}>
              Your request will be sent to the owner/staff. They can reject it
              or process the refund after checking room condition and damage
              cost.
            </div>

            <div style={styles.modalActions}>
              <button
                type="button"
                onClick={closeRefundModal}
                disabled={submittingRefund}
                style={styles.cancelBtn}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={submitRefundRequest}
                disabled={submittingRefund}
                style={styles.submitBtn}
              >
                {submittingRefund ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {renewalDeposit && (
        <RenewalRequestModal
          deposit={renewalDeposit}
          onClose={() => setRenewalDeposit(null)}
          onSuccess={loadDeposits}
        />
      )}

      <Footer />
    </>
  );
}

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
    background: "#fff",
    borderRadius: 16,
    padding: 28,
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
  },
  title: { margin: 0, fontSize: 28 },
  subtitle: { marginTop: 8, color: "#666" },
  list: { display: "grid", gap: 16, marginTop: 24 },
  card: {
    border: "1px solid #eee",
    borderRadius: 14,
    padding: 20,
    background: "#fff",
  },
  roomTitle: { marginTop: 0 },
  note: { color: "#777", marginTop: 12 },
  success: { color: "green", fontWeight: 600, marginTop: 12 },
  refunded: { color: "#2563eb", fontWeight: 600, marginTop: 12 },
  reject: { color: "red", fontWeight: 600, marginTop: 12 },
  actions: { display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" },
  zaloPayBtn: {
    border: "none",
    background: "#0068ff",
    color: "#fff",
    borderRadius: 8,
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 700,
  },
  vnpayBtn: {
    border: "none",
    background: "#005baa",
    color: "#fff",
    borderRadius: 8,
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 700,
  },
  refundBtn: {
    border: "none",
    background: "#ff6b00",
    color: "#fff",
    borderRadius: 8,
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 700,
  },
  renewalBtn: {
    border: "none",
    background: "#16a34a",
    color: "#fff",
    borderRadius: 8,
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 700,
  },
  emptyBox: {
    marginTop: 24,
    padding: 24,
    border: "1px dashed #ddd",
    borderRadius: 12,
    color: "#777",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: 20,
  },
  modal: {
    width: "100%",
    maxWidth: 620,
    background: "#fff",
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  modalTitle: { marginTop: 0, marginBottom: 14 },
  refundInfoBox: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
  },
  label: {
    display: "block",
    marginBottom: 8,
    fontWeight: 700,
  },
  select: {
    width: "100%",
    border: "1px solid #ddd",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    marginBottom: 14,
    outline: "none",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    border: "1px solid #ddd",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    resize: "vertical",
    outline: "none",
    boxSizing: "border-box",
  },
  warningBox: {
    background: "#fff7ed",
    color: "#c2410c",
    border: "1px solid #fed7aa",
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
    lineHeight: 1.5,
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
    color: "#333",
    borderRadius: 8,
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 700,
  },
  submitBtn: {
    border: "none",
    background: "#ff6b00",
    color: "#fff",
    borderRadius: 8,
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 700,
  },
};