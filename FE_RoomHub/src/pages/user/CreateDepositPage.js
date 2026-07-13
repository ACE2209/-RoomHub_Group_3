import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getRoomDetails } from "../../api/room";
import { createDepositRequest } from "../../api/deposit";

export default function CreateDepositPage({ roomId: propRoomId, onClose }) {
  const { roomId: paramRoomId } = useParams();
  const roomId = propRoomId || paramRoomId;
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [roomLoading, setRoomLoading] = useState(false);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const [startDate, setStartDate] = useState("");
  const [rentalTime, setRentalTime] = useState(6);
  const [depositMonths, setDepositMonths] = useState(1);

  const handleClose = () => {
    if (onClose) onClose();
    else navigate(-1);
  };

  useEffect(() => {
    const loadRoom = async () => {
      try {
        setRoomLoading(true);
        const res = await getRoomDetails(roomId);
        setRoom(res?.data || res || null);
      } catch (error) {
        console.error("Load room failed:", error);
      } finally {
        setRoomLoading(false);
      }
    };

    if (roomId) loadRoom();
  }, [roomId]);

  const roomPrice = Number(room?.roomTypeId?.price || 0);

  const depositAmount = useMemo(() => {
    return roomPrice * Number(depositMonths || 1);
  }, [roomPrice, depositMonths]);

  const endDate = useMemo(() => {
    if (!startDate) return "";
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + Number(rentalTime));
    return date.toISOString().slice(0, 10);
  }, [startDate, rentalTime]);

  const formatVnd = (value) =>
    Number(value || 0).toLocaleString("vi-VN") + " VND";

  const getToday = () => new Date().toISOString().slice(0, 10);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!roomId) return alert("Room is required");
    if (!startDate) return alert("Start date is required");
    if (!depositAmount || depositAmount <= 0) {
      return alert("Room price is invalid. Cannot create deposit request.");
    }

    try {
      setLoading(true);

      await createDepositRequest({
        roomId,
        rentalTime: Number(rentalTime),
        depositMonths: Number(depositMonths),
        startDate,
        note,
      });

      alert("Deposit request created. Please wait for owner approval.");

      if (onClose) onClose();
      navigate("/my-deposits");
    } catch (error) {
      alert(error.message || "Create deposit failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <button type="button" onClick={handleClose} style={styles.closeBtn}>
          ×
        </button>

        <div style={styles.header}>
          <p style={styles.eyebrow}>RoomHub deposit</p>
          <h2 style={styles.title}>Create deposit request</h2>
          <p style={styles.subtitle}>
            Choose rental time, contract start date, and deposit amount.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Room</label>
            <input
              value={
                roomLoading
                  ? "Loading room..."
                  : room?.roomNumber
                  ? `Room ${room.roomNumber}`
                  : roomId || ""
              }
              disabled
              style={styles.disabledInput}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Start date *</label>
            <input
              type="date"
              min={getToday()}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Rental time *</label>
            <select
              value={rentalTime}
              onChange={(e) => setRentalTime(e.target.value)}
              style={styles.input}
            >
              <option value={1}>1 month</option>
              <option value={3}>3 months</option>
              <option value={6}>6 months</option>
              <option value={12}>12 months</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>End date</label>
            <input
              value={endDate || "Auto calculated"}
              disabled
              style={styles.disabledInput}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Deposit months *</label>
            <select
              value={depositMonths}
              onChange={(e) => setDepositMonths(e.target.value)}
              style={styles.input}
            >
              <option value={1}>1 month deposit</option>
              <option value={2}>2 months deposit</option>
            </select>
          </div>

          <div style={styles.summaryBox}>
            <div style={styles.row}>
              <span>Room type</span>
              <strong>{room?.roomTypeId?.typeName || "N/A"}</strong>
            </div>

            <div style={styles.row}>
              <span>Monthly price</span>
              <strong>{formatVnd(roomPrice)}</strong>
            </div>

            <div style={styles.row}>
              <span>Deposit rule</span>
              <strong>{depositMonths} month(s)</strong>
            </div>

            <div style={styles.totalRow}>
              <span>Required deposit</span>
              <strong>{formatVnd(depositAmount)}</strong>
            </div>
          </div>

          <div style={styles.notice}>
            You only submit a deposit request now. Payment is made after the
            owner approves this request.
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Note ({note.length}/500)</label>
            <textarea
              value={note}
              maxLength={500}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Example: I want to deposit this room today..."
              style={styles.textarea}
            />
          </div>

          <div style={styles.actions}>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              style={styles.cancelBtn}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || roomLoading}
              style={{
                ...styles.submitBtn,
                opacity: loading || roomLoading ? 0.6 : 1,
                cursor: loading || roomLoading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Submitting..." : "Submit deposit request"}
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
    background: "rgba(15, 23, 42, 0.58)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    zIndex: 9999,
  },
  modal: {
    position: "relative",
    width: "100%",
    maxWidth: "640px",
    background: "#fff",
    borderRadius: "22px",
    padding: "36px",
    boxShadow: "0 30px 90px rgba(15, 23, 42, 0.28)",
    maxHeight: "92vh",
    overflowY: "auto",
  },
  closeBtn: {
    position: "absolute",
    top: "24px",
    right: "24px",
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    border: "none",
    background: "#f1f5f9",
    fontSize: "28px",
    cursor: "pointer",
    color: "#475569",
  },
  header: {
    marginBottom: "24px",
    paddingRight: "58px",
  },
  eyebrow: {
    margin: "0 0 8px",
    color: "#ff6b00",
    fontSize: "13px",
    fontWeight: 900,
    textTransform: "uppercase",
  },
  title: {
    margin: 0,
    color: "#0f172a",
    fontSize: "28px",
    fontWeight: 900,
  },
  subtitle: {
    margin: "8px 0 0",
    color: "#64748b",
    fontSize: "16px",
  },
  formGroup: {
    marginBottom: "16px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    color: "#334155",
    fontSize: "15px",
    fontWeight: 800,
  },
  input: {
    width: "100%",
    height: "50px",
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    padding: "0 16px",
    background: "#fff",
    color: "#0f172a",
    fontSize: "16px",
    boxSizing: "border-box",
  },
  disabledInput: {
    width: "100%",
    height: "50px",
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    padding: "0 16px",
    background: "#f8fafc",
    color: "#475569",
    fontSize: "16px",
    boxSizing: "border-box",
  },
  summaryBox: {
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    overflow: "hidden",
    marginBottom: "18px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    padding: "15px 18px",
    borderBottom: "1px solid #e2e8f0",
    color: "#475569",
    fontSize: "16px",
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    padding: "17px 18px",
    background: "#fff7ed",
    color: "#9a3412",
    fontSize: "16px",
    fontWeight: 900,
  },
  notice: {
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    color: "#475569",
    borderRadius: "12px",
    padding: "14px 16px",
    fontSize: "15px",
    lineHeight: 1.5,
    marginBottom: "18px",
  },
  textarea: {
    width: "100%",
    minHeight: "120px",
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    padding: "16px",
    color: "#101828",
    fontSize: "16px",
    outline: "none",
    resize: "vertical",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "16px",
    paddingTop: "20px",
    marginTop: "20px",
    borderTop: "1px solid #e5e7eb",
  },
  cancelBtn: {
    minWidth: "130px",
    height: "52px",
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#334155",
    borderRadius: "14px",
    fontWeight: 900,
    cursor: "pointer",
    fontSize: "16px",
  },
  submitBtn: {
    minWidth: "220px",
    height: "52px",
    border: "none",
    background: "#ff6b00",
    color: "#fff",
    borderRadius: "14px",
    fontWeight: 900,
    cursor: "pointer",
    fontSize: "16px",
  },
};