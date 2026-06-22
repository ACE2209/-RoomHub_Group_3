import { useCallback, useEffect, useState } from "react";
import Header from "../layout/homepage/header";
import ProfileSidebar from "../profile/ProfileSidebar";
import { getProfileAPI } from "../../api/accountAPI";
import { cancelAppointment, getMyAppointments } from "../../api/appointment";

export default function AppointmentPage() {
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);

      const profileRes = await getProfileAPI();
      const appointmentRes = await getMyAppointments(page, 8);

      setUser(profileRes?.data || profileRes);

      const sortedAppointments = [...(appointmentRes?.data || [])].sort((a, b) => {
  const statusOrder = {
    accepted: 1,
    pending: 2,
    completed: 3,
    rejected: 4,
    canceled: 5,
  };

  const aOrder = statusOrder[a.status] || 99;
  const bOrder = statusOrder[b.status] || 99;

  if (aOrder !== bOrder) {
    return aOrder - bOrder;
  }

  return new Date(a.appointmentDate) - new Date(b.appointmentDate);
});

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

  const openCancelModal = (appointment) => {
    setCancelTarget(appointment);
    setCancelReason("");
    setCancelError("");
  };

  const closeCancelModal = () => {
    setCancelTarget(null);
    setCancelReason("");
    setCancelError("");
  };

  const handleCancel = async () => {
    if (!cancelTarget?._id) {
      setCancelError("Appointment is required.");
      return;
    }

    const reason = cancelReason.trim();

    if (reason.length > 500) {
      setCancelError("Cancel reason cannot exceed 500 characters.");
      return;
    }

    try {
      setCancelLoading(true);
      setCancelError("");

      const res = await cancelAppointment(cancelTarget._id, {
        reasonForCancel: reason || "Canceled by user",
      });

      if (res?.success) {
        alert("Appointment canceled successfully.");
        closeCancelModal();
        loadAppointments();
      } else {
        setCancelError(res?.message || "Cancel failed.");
      }
    } catch (error) {
      setCancelError(error.message || "Cancel failed.");
    } finally {
      setCancelLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("en-GB");
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
                {appointments.map((item) => (
                  <div key={item._id} style={styles.card}>
                    <div style={styles.cardHeader}>
                      <div>
                        <div style={styles.roomRow}>
                          <h3 style={styles.room}>
                            Room {item.roomNumber || "N/A"}
                          </h3>

                          <span
  style={{
    ...styles.badge,
    ...(item.status === "accepted"
      ? styles.acceptedBadge
      : item.status === "pending"
      ? styles.pendingBadge
      : item.status === "completed"
      ? styles.completedBadge
      : item.status === "rejected"
      ? styles.rejectedBadge
      : styles.canceledBadge),
  }}
>
  {item.status === "accepted"
    ? "Upcoming Visit"
    : item.status === "pending"
    ? "Waiting Approval"
    : item.status === "completed"
    ? "Completed"
    : item.status === "rejected"
    ? "Rejected"
    : "Canceled"}
</span>
                        </div>

                        <p style={styles.house}>
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

                      {["canceled", "rejected"].includes(item.status) && (
                        <p>
                          <b>
                            {item.status === "rejected"
                              ? "Reject reason"
                              : "Cancel reason"}
                            :
                          </b>{" "}
                          {item.reasonForCancel || "No reason"}
                        </p>
                      )}
                    </div>

                    {item.status === "pending" && (
                      <div style={styles.actionRow}>
                        <button
                          style={styles.cancelBtn}
                          onClick={() => openCancelModal(item)}
                        >
                          Cancel Appointment
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                <div style={styles.pagination}>
                  <button
                    style={{
                      ...styles.pageBtn,
                      ...(pagination?.hasPrevPage
                        ? {}
                        : styles.disabledBtn),
                    }}
                    disabled={!pagination?.hasPrevPage}
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  >
                    Previous
                  </button>

                  <span style={styles.pageText}>
                    {pagination?.currentPage || page}/
                    {pagination?.totalPages || 1}
                  </span>

                  <button
                    style={{
                      ...styles.pageBtn,
                      ...(pagination?.hasNextPage
                        ? {}
                        : styles.disabledBtn),
                    }}
                    disabled={!pagination?.hasNextPage}
                    onClick={() => setPage((prev) => prev + 1)}
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </main>
        </div>
      </div>

      {cancelTarget && (
        <div style={styles.overlay} onMouseDown={closeCancelModal}>
          <div
            style={styles.cancelModal}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Cancel Appointment</h3>
              <button style={styles.closeBtn} onClick={closeCancelModal}>
                x
              </button>
            </div>

            <p style={styles.desc}>
              Please enter the reason for canceling this appointment.
            </p>

            <div style={styles.miniBox}>
              <p>
                <b>Room:</b> Room {cancelTarget.roomNumber || "N/A"}
              </p>
              <p>
                <b>Boarding House:</b>{" "}
                {cancelTarget.boardingHouseName || "N/A"}
              </p>
              <p>
                <b>Date:</b> {formatDate(cancelTarget.appointmentDate)}
              </p>
            </div>

            {cancelError && <div style={styles.errorBox}>{cancelError}</div>}

            <textarea
              style={styles.textarea}
              value={cancelReason}
              maxLength={500}
              placeholder="Enter cancel reason..."
              onChange={(e) => setCancelReason(e.target.value)}
            />

            <div style={styles.counter}>{cancelReason.length}/500</div>

            <div style={styles.modalActions}>
              <button style={styles.backBtn} onClick={closeCancelModal}>
                Back
              </button>

              <button
                style={{
                  ...styles.cancelBtn,
                  ...(cancelLoading ? styles.loadingBtn : {}),
                }}
                onClick={handleCancel}
                disabled={cancelLoading}
              >
                {cancelLoading ? "Canceling..." : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const statusStyles = {
  pending: {
    background: "#fff7ed",
    color: "#ff5a00",
  },
  accepted: {
    background: "#ecfdf3",
    color: "#027a48",
  },
  rejected: {
    background: "#fef3f2",
    color: "#b42318",
  },
  canceled: {
    background: "#fff1f2",
    color: "#be123c",
  },
  completed: {
    background: "#eef4ff",
    color: "#3538cd",
  },
};

const getStatusStyle = (status) => ({
  ...(statusStyles[status] || statusStyles.pending),
  borderRadius: "20px",
  padding: "6px 12px",
  fontSize: "13px",
  fontWeight: "700",
  textTransform: "capitalize",
  display: "inline-flex",
  alignItems: "center",
  width: "fit-content",
});

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
    gap: "12px",
    marginBottom: "12px",
  },
  roomRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
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
  actionRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "12px",
    flexWrap: "wrap",
  },
  cancelBtn: {
    background: "#ff5a00",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "9px 14px",
    cursor: "pointer",
    fontWeight: "600",
  },
  backBtn: {
    background: "#fff",
    color: "#344054",
    border: "1px solid #d0d5dd",
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
  disabledBtn: {
    background: "#f2f4f7",
    color: "#98a2b3",
    cursor: "not-allowed",
  },
  pageText: {
    color: "#344054",
    fontWeight: 700,
  },
  badge: {
    background: "#ff5a00",
    color: "#fff",
    fontSize: "12px",
    padding: "4px 8px",
    borderRadius: "12px",
    fontWeight: "600",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    padding: "20px",
  },
  cancelModal: {
    background: "#fff",
    borderRadius: "12px",
    width: "min(520px, 100%)",
    padding: "24px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
    marginBottom: "16px",
  },
  modalTitle: {
    margin: 0,
    color: "#1f2937",
  },
  closeBtn: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    border: "1px solid #d0d5dd",
    background: "#fff",
    cursor: "pointer",
  },
  modalActions: {
    marginTop: "18px",
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
  },
  miniBox: {
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "12px 14px",
    margin: "14px 0",
    color: "#344054",
  },
  errorBox: {
    background: "#fef3f2",
    color: "#b42318",
    border: "1px solid #fecdca",
    borderRadius: "8px",
    padding: "10px 12px",
    marginBottom: "12px",
  },
  textarea: {
    width: "100%",
    minHeight: "120px",
    border: "1px solid #d0d5dd",
    borderRadius: "8px",
    padding: "12px",
    resize: "vertical",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  counter: {
    textAlign: "right",
    color: "#667085",
    fontSize: "12px",
    marginTop: "6px",
  },
  loadingBtn: {
    opacity: 0.7,
    cursor: "not-allowed",
  },
  pendingBadge: {
  background: "#fff7ed",
  color: "#ff5a00",
},

acceptedBadge: {
  background: "#ecfdf3",
  color: "#027a48",
},

completedBadge: {
  background: "#eef4ff",
  color: "#3538cd",
},

rejectedBadge: {
  background: "#fef3f2",
  color: "#b42318",
},

canceledBadge: {
  background: "#fff1f2",
  color: "#be123c",
},
};