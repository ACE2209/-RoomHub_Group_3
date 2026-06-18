import { useEffect, useState } from "react";
import { cancelAppointment, getMyAppointments } from "../../api/appointment";

export default function AppointmentPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await getMyAppointments();
      setAppointments(Array.isArray(res?.data) ? res.data : []);
    } catch (error) {
      console.error("Get appointments failed:", error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (appointmentId) => {
    const reasonForCancel = window.prompt("Enter cancel reason:");

    if (reasonForCancel === null) return;

    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this appointment?"
    );

    if (!confirmCancel) return;

    try {
      const res = await cancelAppointment(appointmentId, {
        reasonForCancel: reasonForCancel || "Canceled by user",
      });

      if (res?.success) {
        alert("Appointment canceled successfully");
        fetchAppointments();
      } else {
        alert(res?.message || "Cancel failed");
      }
    } catch (error) {
      console.error("Cancel appointment failed:", error);
      alert(error.message || "Cancel failed");
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleString("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div style={pageStyle}>
      <div style={topStyle}>
        <h2 style={titleStyle}>My Appointments</h2>
      </div>

      {loading ? (
        <div style={emptyStyle}>Loading appointments...</div>
      ) : appointments.length > 0 ? (
        <div style={gridStyle}>
          {appointments.map((item) => (
            <div key={item._id} style={cardStyle}>
              <div style={cardHeaderStyle}>
                <span style={getStatusStyle(item.status)}>
                  {item.status || "pending"}
                </span>

                <span style={dateStyle}>
                  {formatDate(item.appointmentDate)}
                </span>
              </div>

              <div style={sectionStyle}>
                <div style={labelStyle}>Owner</div>
                <div style={valueStyle}>{item.ownerName || "N/A"}</div>
              </div>

              <div style={sectionStyle}>
                <div style={labelStyle}>Boarding House</div>
                <div style={valueStyle}>
                  {item.boardingHouseName || "N/A"}
                </div>
              </div>

              <div style={sectionStyle}>
                <div style={labelStyle}>Room Number</div>
                <div style={valueStyle}>
                  #{item.roomNumber || "N/A"}
                </div>
              </div>

              {item.note && (
                <div style={noteStyle}>
                  <div style={labelStyle}>Note</div>
                  <div style={textStyle}>{item.note}</div>
                </div>
              )}

              {item.reasonForCancel && (
                <div style={reasonStyle}>
                  <div style={labelStyle}>Reason for Cancel</div>
                  <div style={textStyle}>{item.reasonForCancel}</div>
                </div>
              )}

              {item.status === "pending" && (
                <button
                  type="button"
                  style={cancelBtnStyle}
                  onClick={() => handleCancel(item._id)}
                >
                  Cancel Appointment
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={emptyStyle}>No appointment data found</div>
      )}
    </div>
  );
}

const pageStyle = {
  padding: "40px",
  background: "#f8fafc",
  minHeight: "100vh",
};

const topStyle = {
  marginBottom: "28px",
};

const titleStyle = {
  fontSize: "28px",
  fontWeight: "700",
  color: "#27364a",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
  gap: "22px",
};

const cardStyle = {
  background: "white",
  borderRadius: "16px",
  padding: "22px",
  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
  border: "1px solid #e5e7eb",
};

const cardHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
  gap: "10px",
};

const dateStyle = {
  background: "#f3f4f6",
  color: "#344054",
  padding: "8px 12px",
  borderRadius: "8px",
  fontSize: "14px",
  fontWeight: "600",
};

const sectionStyle = {
  background: "#f8fafc",
  borderRadius: "12px",
  padding: "14px",
  marginBottom: "12px",
};

const noteStyle = {
  background: "#fff7e6",
  borderRadius: "12px",
  padding: "14px",
  marginBottom: "12px",
};

const reasonStyle = {
  background: "#fff1f3",
  borderRadius: "12px",
  padding: "14px",
  marginBottom: "12px",
};

const labelStyle = {
  fontSize: "13px",
  fontWeight: "700",
  color: "#667085",
  textTransform: "uppercase",
  marginBottom: "6px",
};

const valueStyle = {
  fontSize: "17px",
  fontWeight: "700",
  color: "#111827",
};

const textStyle = {
  color: "#344054",
  lineHeight: "1.5",
};

const cancelBtnStyle = {
  width: "100%",
  background: "#d92d20",
  color: "white",
  border: "none",
  padding: "12px",
  borderRadius: "10px",
  fontWeight: "700",
  cursor: "pointer",
  marginTop: "8px",
};

const emptyStyle = {
  background: "white",
  padding: "40px",
  textAlign: "center",
  borderRadius: "12px",
  color: "#667085",
};

const getStatusStyle = (status) => {
  const base = {
    color: "white",
    padding: "8px 14px",
    borderRadius: "20px",
    fontWeight: "700",
    textTransform: "capitalize",
    fontSize: "14px",
  };

  switch (status) {
    case "accepted":
      return { ...base, background: "#2563eb" };
    case "rejected":
      return { ...base, background: "#d92d20" };
    case "canceled":
      return { ...base, background: "#dc2626" };
    case "completed":
      return { ...base, background: "#16a34a" };
    default:
      return { ...base, background: "#f59e0b" };
  }
};