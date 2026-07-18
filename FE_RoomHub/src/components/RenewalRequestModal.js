import { useState } from "react";
import { createRenewalRequest } from "../api/renewalRequestAPI";

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

const toInputDate = (value) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

export default function RenewalRequestModal({ deposit, onClose, onSuccess }) {
  const [requestedEndDate, setRequestedEndDate] = useState("");
  const [tenantNote, setTenantNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const room = deposit?.roomId;
  const minDate = toInputDate(deposit?.endDate);

  const submitRenewalRequest = async () => {
    try {
      if (!requestedEndDate) {
        alert("Please select the new end date");
        return;
      }

      if (minDate && requestedEndDate <= minDate) {
        alert("New end date must be after the current end date");
        return;
      }

      setSubmitting(true);

      await createRenewalRequest({
        depositRoomId: deposit._id,
        requestedEndDate,
        tenantNote: tenantNote.trim(),
      });

      alert("Renewal request created successfully");
      onSuccess?.();
      onClose();
    } catch (error) {
      alert(error.message || "Create renewal request failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!deposit) return null;

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <h2 style={styles.modalTitle}>Request Rental Renewal</h2>

        <div style={styles.infoBox}>
          <p>
            Room: <b>{room?.roomNumber || "N/A"}</b>
          </p>
          <p>
            Boarding house: <b>{room?.boardingHouseId?.name || "N/A"}</b>
          </p>
          <p>
            Deposit amount: <b>{formatCurrency(deposit.amount)}</b>
          </p>
          <p>
            Current end date: <b>{formatDate(deposit.endDate)}</b>
          </p>
        </div>

        <label style={styles.label}>New End Date *</label>
        <input
          type="date"
          value={requestedEndDate}
          min={minDate}
          onChange={(e) => setRequestedEndDate(e.target.value)}
          style={styles.input}
        />

        <label style={styles.label}>Note for Owner/Staff</label>
        <textarea
          rows={4}
          value={tenantNote}
          onChange={(e) => setTenantNote(e.target.value)}
          placeholder="Add a note about your renewal request (optional)..."
          style={styles.textarea}
        />

        <div style={styles.warningBox}>
          Your renewal request will be sent to the owner/staff. The rental end
          date is only extended after the request is accepted.
        </div>

        <div style={styles.modalActions}>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={styles.cancelBtn}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={submitRenewalRequest}
            disabled={submitting}
            style={styles.submitBtn}
          >
            {submitting ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
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
    maxWidth: 560,
    background: "#fff",
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  modalTitle: { marginTop: 0, marginBottom: 14 },
  infoBox: {
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
  input: {
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
