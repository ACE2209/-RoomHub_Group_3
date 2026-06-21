import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createAppointment } from "../../api/appointment";
import { getRoomDetails } from "../../api/room";

export default function CreateAppointmentPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [roomNumber, setRoomNumber] = useState("");
  const [roomLoading, setRoomLoading] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const minDateTime = useMemo(() => {
    const date = new Date();
    date.setHours(date.getHours() + 1);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
  }, []);

  useEffect(() => {
    const loadRoom = async () => {
      try {
        setRoomLoading(true);

        const res = await getRoomDetails(roomId);

        if (res?.success) {
          setRoomNumber(res.data?.roomNumber || "");
        }
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!roomId) return alert("Room is required");
    if (!appointmentDate) return alert("Date & time is required");
    if (note.trim().length > 500) return alert("Note cannot exceed 500 characters");

    const selectedDate = new Date(appointmentDate);
    const oneHourLater = new Date();
    oneHourLater.setHours(oneHourLater.getHours() + 1);

    if (selectedDate < oneHourLater) {
      return alert("Appointment must be scheduled at least 1 hour in advance");
    }

    try {
      setLoading(true);

      const res = await createAppointment({
        roomId,
        appointmentDate: selectedDate.toISOString(),
        note: note.trim(),
      });

      if (res?.success) {
        alert("Appointment created successfully");
        navigate("/appointments");
      } else {
        alert(res?.message || "Create appointment failed");
      }
    } catch (error) {
      alert(error?.message || "Create appointment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <button type="button" onClick={() => navigate(-1)} style={styles.backBtn}>
          ← Back
        </button>

        <div style={styles.header}>
          <div>
            <p style={styles.eyebrow}>RoomHub appointment</p>
            <h1 style={styles.title}>Create a room viewing request</h1>
            <p style={styles.subtitle}>
              Choose your preferred viewing time and add any note for the owner.
            </p>
          </div>

          <div style={styles.icon}>📅</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Room</label>
            <input
              value={
                roomLoading
                  ? "Loading room..."
                  : roomNumber
                  ? `Room ${roomNumber}`
                  : roomId
              }
              disabled
              style={styles.disabledInput}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              Date & Time <span style={styles.required}>*</span>
            </label>
            <input
              type="datetime-local"
              value={appointmentDate}
              min={minDateTime}
              onChange={(e) => setAppointmentDate(e.target.value)}
              style={styles.input}
            />
            <small style={styles.helpText}>
              Appointment must be scheduled at least 1 hour in advance.
            </small>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Note ({note.length}/500)</label>
            <textarea
              value={note}
              maxLength={500}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Example: I want to view the room in the morning..."
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
            {loading ? "Submitting..." : "Submit request"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #f8fafc 0%, #eef6ff 100%)",
    padding: "48px 20px",
    display: "flex",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    maxWidth: "640px",
    background: "#fff",
    borderRadius: "20px",
    padding: "32px",
    boxShadow: "0 20px 50px rgba(15, 23, 42, 0.1)",
    border: "1px solid #e5e7eb",
  },
  backBtn: {
    background: "transparent",
    border: "none",
    color: "#475467",
    fontSize: "15px",
    fontWeight: 600,
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
    color: "#14b8a6",
    fontSize: "13px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
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
  icon: {
    width: "58px",
    height: "58px",
    borderRadius: "18px",
    background: "#ecfdf3",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "28px",
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
    borderRadius: "12px",
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
    borderRadius: "12px",
    padding: "0 14px",
    color: "#667085",
    background: "#f9fafb",
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box",
    cursor: "not-allowed",
  },
  textarea: {
    width: "100%",
    minHeight: "130px",
    border: "1px solid #d0d5dd",
    borderRadius: "12px",
    padding: "14px",
    color: "#101828",
    fontSize: "15px",
    outline: "none",
    resize: "vertical",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  helpText: {
    display: "block",
    marginTop: "8px",
    color: "#667085",
    fontSize: "13px",
  },
  submitBtn: {
    width: "100%",
    height: "50px",
    background: "#14b8a6",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontWeight: 800,
    fontSize: "16px",
  },
};