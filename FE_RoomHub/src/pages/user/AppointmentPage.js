import { useCallback, useEffect, useState } from "react";import Header from "../layout/homepage/header";
import ProfileSidebar from "../profile/ProfileSidebar";
import { getProfileAPI } from "../../api/accountAPI";
import { cancelAppointment, getMyAppointments } from "../../api/appointment";

export default function AppointmentPage() {
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const loadAppointments = useCallback(async () => {
  try {
    setLoading(true);
    const profileRes = await getProfileAPI();
    const appointmentRes = await getMyAppointments(page, 8);

    setUser(profileRes?.data || profileRes);

    const sortedAppointments = [...(appointmentRes?.data || [])].sort(
      (a, b) => {
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (a.status !== "pending" && b.status === "pending") return 1;

        return new Date(b.appointmentDate) - new Date(a.appointmentDate);
      }
    );

    setAppointments(sortedAppointments);
    setPagination(appointmentRes?.pagination || null);
  } catch (error) {
    console.error("Get appointments failed:", error);
    setAppointments([]);
  } finally {
    setLoading(false);
  }
}, [page]);

useEffect(() => {
  loadAppointments();
}, [loadAppointments]);

  const handleCancel = async (id) => {
    const reason = window.prompt("Enter cancel reason:");
    if (reason === null) return;

    if (!window.confirm("Cancel this appointment?")) return;

    try {
      const res = await cancelAppointment(id, {
        reasonForCancel: reason.trim() || "Canceled by user",
      });

      if (res?.success) {
        alert("Appointment canceled");
        loadAppointments();
      } else {
        alert(res?.message || "Cancel failed");
      }
    } catch (error) {
      alert(error.message || "Cancel failed");
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString();
  };

  return (
    <>
      <Header />

      <div style={styles.page}>
        <div style={styles.wrapper}>
          <ProfileSidebar user={user} />

          <main style={styles.content}>
            <div style={styles.header}>
              <div>
                <h2 style={styles.title}>My Appointments</h2>
                <p style={styles.desc}>Manage your room viewing requests.</p>
              </div>

              <div style={styles.total}>
                {pagination?.totalItems || appointments.length} total
              </div>
            </div>

            {loading ? (
              <div style={styles.empty}>Loading...</div>
            ) : appointments.length === 0 ? (
              <div style={styles.empty}>No appointments found.</div>
            ) : (
              <>
                {appointments.map((item, index) => (
                  <div key={item._id} style={styles.card}>
                    <div style={styles.cardHeader}>
                      <div>
<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
  <h3 style={styles.room}>
    Room {item.roomNumber || "N/A"}
  </h3>

  {index === 0 && item.status === "pending" && (
    <span style={styles.badge}>
      Upcoming
    </span>
  )}
</div>                        <p style={styles.house}>
                          {item.boardingHouseName || "No boarding house"}
                        </p>
                      </div>

                      <span style={getStatusStyle(item.status)}>
                        {item.status || "pending"}
                      </span>
                    </div>

                    <div style={styles.info}>
                      <p>
                        <b>Date:</b> {formatDate(item.appointmentDate)}
                      </p>
                      <p>
                        <b>Owner:</b> {item.ownerName || "N/A"}
                      </p>
                      {item.note && (
                        <p>
                          <b>Note:</b> {item.note}
                        </p>
                      )}
                      {item.status === "canceled" && (
                        <p>
                          <b>Cancel reason:</b>{" "}
                          {item.reasonForCancel || "No reason"}
                        </p>
                      )}
                    </div>

                    {item.status === "pending" && (
                      <button
                        style={styles.cancelBtn}
                        onClick={() => handleCancel(item._id)}
                      >
                        Cancel Appointment
                      </button>
                    )}
                  </div>
                ))}

                <div style={styles.pagination}>
                  <button
                    style={styles.pageBtn}
                    disabled={!pagination?.hasPrevPage}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </button>

                  <span>
                    Page {pagination?.currentPage || page} /{" "}
                    {pagination?.totalPages || 1}
                  </span>

                  <button
                    style={styles.pageBtn}
                    disabled={!pagination?.hasNextPage}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f6f8",
    padding: "32px 0",
  },
  wrapper: {
    width: "1080px",
    margin: "0 auto",
    display: "flex",
    gap: "20px",
    alignItems: "flex-start",
  },
  content: {
    flex: 1,
    background: "#fff",
    borderRadius: "14px",
    padding: "26px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "22px",
  },
  title: {
    margin: "0 0 6px",
    fontSize: "26px",
    color: "#1f2937",
  },
  desc: {
    margin: 0,
    color: "#667085",
  },
  total: {
    background: "#fff7ed",
    color: "#ff5a00",
    border: "1px solid #fed7aa",
    borderRadius: "20px",
    padding: "8px 14px",
    height: "fit-content",
    fontWeight: "600",
  },
  card: {
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "18px",
    marginBottom: "14px",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "12px",
  },
  room: {
    margin: 0,
    fontSize: "18px",
    color: "#111827",
  },
  house: {
    margin: "4px 0 0",
    color: "#667085",
  },
  info: {
    background: "#f9fafb",
    borderRadius: "10px",
    padding: "12px 14px",
    color: "#344054",
    fontSize: "14px",
  },
  cancelBtn: {
    marginTop: "12px",
    background: "#ff5a00",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "9px 14px",
    cursor: "pointer",
    fontWeight: "600",
  },
  empty: {
    padding: "40px",
    textAlign: "center",
    background: "#f9fafb",
    color: "#667085",
    borderRadius: "10px",
  },
  pagination: {
    marginTop: "18px",
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    alignItems: "center",
  },
  pageBtn: {
    padding: "8px 12px",
    border: "1px solid #d0d5dd",
    background: "#fff",
    borderRadius: "7px",
    cursor: "pointer",
  },
  badge: {
  background: "#ff5a00",
  color: "#fff",
  fontSize: "12px",
  padding: "4px 8px",
  borderRadius: "12px",
  fontWeight: "600",
},
};

const getStatusStyle = (status) => ({
  background:
    status === "pending"
      ? "#fff7ed"
      : status === "canceled"
      ? "#fff1f2"
      : "#ecfdf3",
  color:
    status === "pending"
      ? "#ff5a00"
      : status === "canceled"
      ? "#be123c"
      : "#027a48",
  borderRadius: "20px",
  padding: "6px 12px",
  fontSize: "13px",
  fontWeight: "700",
  textTransform: "capitalize",
});