import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getRoomDetails } from "../../api/room";
import { createDepositRequest } from "../../api/deposit";

export default function CreateDepositPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [roomLoading, setRoomLoading] = useState(false);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

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

  // Bắt buộc cọc 30% giá phòng
  const depositAmount = useMemo(() => {
    if (!roomPrice) return 0;
    return Math.round(roomPrice * 0.3);
  }, [roomPrice]);

  const formatVnd = (value) =>
    Number(value || 0).toLocaleString("vi-VN") + " VND";

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!roomId) return alert("Room is required");
    if (!depositAmount || depositAmount <= 0) {
      return alert("Room price is invalid. Cannot create deposit request.");
    }

    try {
      setLoading(true);

      const start = new Date();
      const end = new Date();
      end.setMonth(end.getMonth() + 6);

      await createDepositRequest({
        roomId,
        amount: depositAmount,
        note,
        rentalTime: 6,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });

      alert("Deposit request created. Please wait for owner approval.");
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
        <button type="button" onClick={() => navigate(-1)} style={styles.closeBtn}>
          ×
        </button>

        <div style={styles.header}>
          <p style={styles.eyebrow}>RoomHub deposit</p>
          <h2 style={styles.title}>Create deposit request</h2>
          <p style={styles.subtitle}>
            Deposit is fixed at 30% of the monthly room price.
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
                  : roomId
              }
              disabled
              style={styles.disabledInput}
            />
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
              <span>Deposit rate</span>
              <strong>30%</strong>
            </div>

            <div style={styles.totalRow}>
              <span>Required deposit</span>
              <strong>{formatVnd(depositAmount)}</strong>
            </div>
          </div>

          <div style={styles.notice}>
            You only submit a deposit request now. Payment is made after the owner
            approves this request.
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
              onClick={() => navigate(-1)}
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
    minHeight: "100vh",
    background: "rgba(15, 23, 42, 0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
  },
  modal: {
    position: "relative",
    width: "100%",
    maxWidth: "560px",
    background: "#fff",
    borderRadius: "14px",
    padding: "28px",
    boxShadow: "0 24px 80px rgba(0,0,0,0.22)",
  },
  closeBtn: {
    position: "absolute",
    top: "14px",
    right: "18px",
    border: "none",
    background: "transparent",
    fontSize: "30px",
    cursor: "pointer",
    color: "#667085",
  },
  header: {
    marginBottom: "22px",
    paddingRight: "32px",
  },
  eyebrow: {
    margin: "0 0 8px",
    color: "#ff6b00",
    fontSize: "13px",
    fontWeight: 800,
    textTransform: "uppercase",
  },
  title: {
    margin: 0,
    color: "#101828",
    fontSize: "26px",
  },
  subtitle: {
    margin: "8px 0 0",
    color: "#667085",
    fontSize: "15px",
  },
  formGroup: {
    marginBottom: "16px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    color: "#344054",
    fontSize: "14px",
    fontWeight: 700,
  },
  disabledInput: {
    width: "100%",
    height: "46px",
    border: "1px solid #d0d5dd",
    borderRadius: "8px",
    padding: "0 14px",
    background: "#f9fafb",
    color: "#667085",
    fontSize: "15px",
    boxSizing: "border-box",
  },
  summaryBox: {
    border: "1px solid #eef0f3",
    borderRadius: "10px",
    overflow: "hidden",
    marginBottom: "16px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    padding: "13px 14px",
    borderBottom: "1px solid #eef0f3",
    color: "#475467",
  },
  totalRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    padding: "15px 14px",
    background: "#fff7ed",
    color: "#9a3412",
    fontSize: "16px",
  },
  notice: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    color: "#475467",
    borderRadius: "8px",
    padding: "12px 14px",
    fontSize: "14px",
    lineHeight: 1.5,
    marginBottom: "16px",
  },
  textarea: {
    width: "100%",
    minHeight: "110px",
    border: "1px solid #d0d5dd",
    borderRadius: "8px",
    padding: "14px",
    color: "#101828",
    fontSize: "15px",
    outline: "none",
    resize: "vertical",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  actions: {
    display: "flex",
    gap: "12px",
  },
  cancelBtn: {
    flex: 1,
    height: "48px",
    border: "1px solid #d0d5dd",
    background: "#fff",
    color: "#344054",
    borderRadius: "8px",
    fontWeight: 800,
    cursor: "pointer",
  },
  submitBtn: {
    flex: 2,
    height: "48px",
    border: "none",
    background: "#ff6b00",
    color: "#fff",
    borderRadius: "8px",
    fontWeight: 800,
    cursor: "pointer",
  },
};