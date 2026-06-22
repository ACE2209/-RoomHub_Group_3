import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getRoomDetails } from "../../api/room";

export default function CreateDepositPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [roomLoading, setRoomLoading] = useState(false);
  const [amount, setAmount] = useState("");
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

    if (roomId) {
      loadRoom();
    }
  }, [roomId]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!roomId) return alert("Room is required");
    if (!amount || Number(amount) <= 0) return alert("Deposit amount is required");
    if (note.trim().length > 500) return alert("Note cannot exceed 500 characters");

    setLoading(true);
    alert("Deposit request page is ready. Backend deposit API is not connected yet.");
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <button type="button" onClick={() => navigate(-1)} style={styles.backBtn}>
          Back
        </button>

        <div style={styles.header}>
          <div>
            <p style={styles.eyebrow}>RoomHub deposit</p>
            <h1 style={styles.title}>Create a room deposit request</h1>
            <p style={styles.subtitle}>
              Confirm the room and enter the amount you want to deposit.
            </p>
          </div>

          <div style={styles.badge}>Deposit</div>
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

          {room?.roomTypeId && (
            <div style={styles.roomSummary}>
              <span>{room.roomTypeId.typeName || "Room type"}</span>
              <strong>
                {Number(room.roomTypeId.price).toLocaleString("vi-VN")} VND
              </strong>
            </div>
          )}

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Deposit amount <span style={styles.required}>*</span>
            </label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter deposit amount"
              style={styles.input}
            />
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

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitBtn,
              opacity: loading ? 0.6 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Submitting..." : "Submit deposit"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f6f7f9",
    padding: "48px 20px",
    display: "flex",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    maxWidth: "640px",
    background: "#fff",
    borderRadius: "8px",
    padding: "32px",
    boxShadow: "0 20px 50px rgba(15, 23, 42, 0.1)",
    border: "1px solid #e5e7eb",
  },
  backBtn: {
    background: "transparent",
    border: "none",
    color: "#475467",
    fontSize: "15px",
    fontWeight: 700,
    cursor: "pointer",
    marginBottom: "24px",
    padding: 0,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: "24px",
    marginBottom: "28px",
  },
  eyebrow: {
    margin: "0 0 8px",
    color: "#ff6b00",
    fontSize: "13px",
    fontWeight: 800,
    textTransform: "uppercase",
    letterSpacing: 0,
  },
  title: {
    margin: 0,
    color: "#101828",
    fontSize: "30px",
    lineHeight: 1.2,
  },
  subtitle: {
    margin: "10px 0 0",
    color: "#667085",
    fontSize: "15px",
    lineHeight: 1.5,
  },
  badge: {
    alignSelf: "start",
    background: "#fff4ed",
    borderRadius: "999px",
    color: "#c4320a",
    fontWeight: 800,
    padding: "9px 12px",
  },
  formGroup: {
    marginBottom: "18px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    color: "#344054",
    fontSize: "14px",
    fontWeight: 700,
  },
  required: {
    color: "#ef4444",
  },
  input: {
    width: "100%",
    height: "48px",
    border: "1px solid #d0d5dd",
    borderRadius: "8px",
    padding: "0 14px",
    color: "#101828",
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box",
  },
  disabledInput: {
    width: "100%",
    height: "48px",
    border: "1px solid #d0d5dd",
    borderRadius: "8px",
    padding: "0 14px",
    color: "#667085",
    background: "#f9fafb",
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box",
    cursor: "not-allowed",
  },
  roomSummary: {
    alignItems: "center",
    background: "#f8fafc",
    border: "1px solid #eef0f3",
    borderRadius: "8px",
    color: "#475467",
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "18px",
    padding: "12px 14px",
  },
  textarea: {
    width: "100%",
    minHeight: "130px",
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
  submitBtn: {
    width: "100%",
    height: "50px",
    background: "#ff6b00",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: 800,
    fontSize: "16px",
  },
};
