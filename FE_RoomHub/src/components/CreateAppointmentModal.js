import { useMemo, useState } from "react";
import { CalendarDays, Clock, X } from "lucide-react";
import { createAppointment } from "../api/appointment";

export default function CreateAppointmentModal({ room, onClose, onSuccess }) {
  const [appointmentDate, setAppointmentDate] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const minDateTime = useMemo(() => {
    const date = new Date();
    date.setHours(date.getHours() + 1);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!room?._id) {
      setError("Room is required.");
      return;
    }

    if (!appointmentDate) {
      setError("Please select appointment date and time.");
      return;
    }

    if (note.trim().length > 500) {
      setError("Note cannot exceed 500 characters.");
      return;
    }

    const selectedDate = new Date(appointmentDate);
    const oneHourLater = new Date();
    oneHourLater.setHours(oneHourLater.getHours() + 1);

    if (selectedDate < oneHourLater) {
      setError("Appointment must be scheduled at least 1 hour in advance.");
      return;
    }

    try {
      setLoading(true);

      const res = await createAppointment({
        roomId: room._id,
        appointmentDate: selectedDate.toISOString(),
        note: note.trim(),
      });

      if (res?.success) {
        alert("Appointment request submitted successfully.");
        onSuccess?.(res.data);
        onClose();
      } else {
        setError(res?.message || "Create appointment failed.");
      }
    } catch (error) {
      setError(error?.message || "Create appointment failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay} onMouseDown={onClose}>
      <div style={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.iconBox}>
            <CalendarDays size={24} />
          </div>

          <div style={styles.headerText}>
            <h2 style={styles.title}>Create room viewing request</h2>
            <p style={styles.subtitle}>
              Choose a suitable time to visit this room.
            </p>
          </div>

          <button type="button" onClick={onClose} style={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.roomBox}>
            <span style={styles.roomLabel}>Selected room</span>

            <strong style={styles.roomValue}>
              Room {room?.roomNumber || "N/A"}
            </strong>

            <span
              style={{
                ...styles.roomStatus,
                ...(room?.isAvailable ? styles.available : styles.unavailable),
              }}
            >
              {room?.isAvailable ? "Available" : "Unavailable"}
            </span>
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Date & Time <span style={styles.required}>*</span>
            </label>

            <div style={styles.inputWrap}>
              <Clock size={18} style={styles.inputIcon} />

              <input
                type="datetime-local"
                value={appointmentDate}
                min={minDateTime}
                onChange={(e) => setAppointmentDate(e.target.value)}
                style={styles.input}
              />
            </div>

            <small style={styles.helpText}>
              Please choose a time at least 1 hour from now.
            </small>
          </div>

          <div style={styles.formGroup}>
            <div style={styles.noteHeader}>
              <label style={styles.label}>Note</label>
              <span style={styles.counter}>{note.length}/500</span>
            </div>

            <textarea
              value={note}
              maxLength={500}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Example: I would like to visit in the afternoon..."
              style={styles.textarea}
            />
          </div>

          <div style={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              style={styles.cancelBtn}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || !room?.isAvailable}
              style={{
                ...styles.submitBtn,
                opacity: loading || !room?.isAvailable ? 0.7 : 1,
                cursor:
                  loading || !room?.isAvailable ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Submitting..." : "Submit request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.55)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "20px",
  },
  modal: {
    width: "100%",
    maxWidth: "540px",
    background: "#ffffff",
    borderRadius: "22px",
    padding: "24px",
    boxShadow: "0 24px 70px rgba(15, 23, 42, 0.28)",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
    marginBottom: "20px",
  },
  iconBox: {
    width: "48px",
    height: "48px",
    borderRadius: "16px",
    background: "#ecfdf5",
    color: "#0f766e",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerText: {
    flex: 1,
  },
  title: {
    margin: 0,
    color: "#101828",
    fontSize: "22px",
    fontWeight: 800,
    lineHeight: 1.25,
  },
  subtitle: {
    margin: "6px 0 0",
    color: "#667085",
    fontSize: "14px",
    lineHeight: 1.5,
  },
  closeBtn: {
    width: "36px",
    height: "36px",
    borderRadius: "999px",
    border: "none",
    background: "#f2f4f7",
    color: "#475467",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  roomBox: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "4px 12px",
    padding: "16px",
    border: "1px solid #d1fae5",
    background: "#f0fdfa",
    borderRadius: "16px",
    marginBottom: "16px",
  },
  roomLabel: {
    color: "#667085",
    fontSize: "13px",
    gridColumn: "1 / -1",
  },
  roomValue: {
    color: "#0f172a",
    fontSize: "18px",
  },
  roomStatus: {
    alignSelf: "center",
    padding: "5px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 800,
  },
  available: {
    background: "#ccfbf1",
    color: "#0f766e",
  },
  unavailable: {
    background: "#fee2e2",
    color: "#b42318",
  },
  errorBox: {
    padding: "12px 14px",
    borderRadius: "12px",
    background: "#fef2f2",
    color: "#b42318",
    border: "1px solid #fecaca",
    fontSize: "14px",
    marginBottom: "16px",
  },
  formGroup: {
    marginBottom: "16px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    color: "#344054",
    fontSize: "14px",
    fontWeight: 800,
  },
  required: {
    color: "#ef4444",
  },
  inputWrap: {
    position: "relative",
  },
  inputIcon: {
    position: "absolute",
    left: "13px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#667085",
    pointerEvents: "none",
  },
  input: {
    width: "100%",
    height: "46px",
    border: "1px solid #d0d5dd",
    borderRadius: "12px",
    padding: "0 12px 0 42px",
    fontSize: "14px",
    color: "#101828",
    outline: "none",
    boxSizing: "border-box",
  },
  helpText: {
    display: "block",
    marginTop: "7px",
    color: "#667085",
    fontSize: "12px",
  },
  noteHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  counter: {
    color: "#98a2b3",
    fontSize: "12px",
    fontWeight: 700,
  },
  textarea: {
    width: "100%",
    minHeight: "110px",
    border: "1px solid #d0d5dd",
    borderRadius: "12px",
    padding: "12px 14px",
    fontSize: "14px",
    resize: "vertical",
    boxSizing: "border-box",
    fontFamily: "inherit",
    outline: "none",
    color: "#101828",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "22px",
    paddingTop: "18px",
    borderTop: "1px solid #eaecf0",
  },
  cancelBtn: {
    padding: "11px 18px",
    border: "1px solid #d0d5dd",
    background: "#ffffff",
    color: "#344054",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: 800,
  },
  submitBtn: {
    padding: "11px 20px",
    border: "none",
    background: "#14b8a6",
    color: "#ffffff",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: 800,
    boxShadow: "0 8px 18px rgba(20, 184, 166, 0.28)",
  },
};