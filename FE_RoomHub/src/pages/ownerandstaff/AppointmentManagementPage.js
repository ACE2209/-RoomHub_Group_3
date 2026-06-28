import { useCallback, useEffect, useState } from "react";
import { CalendarCheck, Search, RotateCcw } from "lucide-react";

import AdminLayout from "../layout/admin/AdminLayout";
import {
  getManagedAppointments,
  getManagedAppointmentDetail,
  updateManagedAppointmentStatus,
} from "../../api/ownerandstaff/managedAppointment";

const statusColor = {
  pending: { bg: "#fffaeb", color: "#b54708", border: "#fedf89" },
  accepted: { bg: "#ecfdf3", color: "#087443", border: "#abefc6" },
  rejected: { bg: "#fef3f2", color: "#b42318", border: "#fecdca" },
  canceled: { bg: "#f2f4f7", color: "#344054", border: "#d0d5dd" },
  completed: { bg: "#eef4ff", color: "#3538cd", border: "#c7d7fe" },
};

export default function AppointmentManagementPage() {
  const [appointments, setAppointments] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [keyword, setKeyword] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selected, setSelected] = useState(null);
  const [detailLoadingId, setDetailLoadingId] = useState("");

  const [acceptTarget, setAcceptTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const [actionLoadingId, setActionLoadingId] = useState("");
  const [actionError, setActionError] = useState("");

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
        setAppointments([]);
        setError("From date cannot be greater than to date.");
        return;
      }

      const res = await getManagedAppointments({
        page,
        limit: pagination.limit,
        status,
        keyword: searchKeyword,
        fromDate,
        toDate,
      });

      if (res?.success) {
        setAppointments(res.data || []);
        setPagination((prev) => ({
          ...prev,
          ...(res.pagination || {}),
        }));
      } else {
        setAppointments([]);
        setError(res?.message || "Unable to load appointments.");
      }
    } catch (err) {
      setAppointments([]);
      setError(err.message || "Unable to load appointments.");
    } finally {
      setLoading(false);
    }
  }, [page, pagination.limit, status, searchKeyword, fromDate, toDate]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearchKeyword(keyword.trim());
  };

  const handleClearFilter = () => {
    setKeyword("");
    setSearchKeyword("");
    setStatus("");
    setFromDate("");
    setToDate("");
    setPage(1);
  };

  const openDetail = async (appointmentId) => {
    try {
      setDetailLoadingId(appointmentId);

      const res = await getManagedAppointmentDetail(appointmentId);

      if (res?.success) {
        setSelected(res.data || null);
      } else {
        alert(res?.message || "Unable to load appointment detail.");
      }
    } catch (err) {
      alert(err.message || "Unable to load appointment detail.");
    } finally {
      setDetailLoadingId("");
    }
  };

  const openAcceptModal = (appointment) => {
    setAcceptTarget(appointment);
    setActionError("");
  };

  const openRejectModal = (appointment) => {
    setRejectTarget(appointment);
    setRejectReason("");
    setActionError("");
  };

  const closeActionModal = () => {
    setAcceptTarget(null);
    setRejectTarget(null);
    setRejectReason("");
    setActionError("");
  };

  const handleAccept = async () => {
    if (!acceptTarget?._id) {
      setActionError("Appointment is required.");
      return;
    }

    try {
      setActionLoadingId(acceptTarget._id);
      setActionError("");

      const res = await updateManagedAppointmentStatus(acceptTarget._id, {
        status: "accepted",
      });

      if (res?.success) {
        alert(
          `Appointment accepted successfully${
            res.autoRejectedCount
              ? `. Auto rejected ${res.autoRejectedCount} conflicting appointment(s).`
              : "."
          }`
        );

        closeActionModal();
        setSelected(null);
        await fetchAppointments();
      } else {
        setActionError(res?.message || "Accept appointment failed.");
      }
    } catch (err) {
      setActionError(err.message || "Accept appointment failed.");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleReject = async () => {
    if (!rejectTarget?._id) {
      setActionError("Appointment is required.");
      return;
    }

    const reason = rejectReason.trim();

    if (!reason) {
      setActionError("Reject reason is required.");
      return;
    }

    if (reason.length > 500) {
      setActionError("Reject reason cannot exceed 500 characters.");
      return;
    }

    try {
      setActionLoadingId(rejectTarget._id);
      setActionError("");

      const res = await updateManagedAppointmentStatus(rejectTarget._id, {
        status: "rejected",
        reasonForCancel: reason,
      });

      if (res?.success) {
        alert("Appointment rejected successfully.");

        closeActionModal();
        setSelected(null);
        await fetchAppointments();
      } else {
        setActionError(res?.message || "Reject appointment failed.");
      }
    } catch (err) {
      setActionError(err.message || "Reject appointment failed.");
    } finally {
      setActionLoadingId("");
    }
  };

  return (
    <AdminLayout>
      <div style={headerStyle}>
        <div>
          <h2 style={titleStyle}>Appointment Management</h2>
          <p style={subtitleStyle}>
            Manage room viewing appointments from users.
          </p>
        </div>

        <div style={summaryItemStyle}>
          <CalendarCheck size={18} />
          <span>{pagination.totalItems || 0} appointments</span>
        </div>
      </div>

      <form style={filterCardStyle} onSubmit={handleSearch}>
        <input
          style={inputStyle}
          placeholder="Search by user, email, phone, room..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />

        <select
          style={selectStyle}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All status</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="canceled">Canceled</option>
          <option value="completed">Completed</option>
        </select>

        <input
          style={dateInputStyle}
          type="date"
          value={fromDate}
          onChange={(e) => {
            setFromDate(e.target.value);
            setPage(1);
          }}
        />

        <input
          style={dateInputStyle}
          type="date"
          value={toDate}
          onChange={(e) => {
            setToDate(e.target.value);
            setPage(1);
          }}
        />

        <button style={searchBtnStyle} type="submit" disabled={loading}>
          <Search size={15} />
          Search
        </button>

        <button
          style={clearBtnStyle}
          type="button"
          onClick={handleClearFilter}
          disabled={loading}
        >
          <RotateCcw size={15} />
          Clear
        </button>
      </form>

      <div style={tableCardStyle}>
        <table style={tableStyle}>
          <thead>
            <tr style={headerRowStyle}>
              <th style={thStyle}>User</th>
              <th style={thStyle}>Boarding House</th>
              <th style={thStyle}>Room</th>
              <th style={thStyle}>Appointment Date</th>
              <th style={thStyle}>Status</th>
              <th style={thStyle}>Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={emptyStyle}>
                  Loading appointments...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="6" style={emptyStyle}>
                  {error}
                </td>
              </tr>
            ) : appointments.length ? (
              appointments.map((item) => (
                <tr key={item._id} style={rowStyle}>
                  <td style={tdStyle}>
                    <strong>{item.user?.fullname || "N/A"}</strong>
                    <div style={mutedStyle}>
                      {item.user?.email || "No email"}
                    </div>
                    <div style={mutedStyle}>
                      {item.user?.phoneNumber || ""}
                    </div>
                  </td>

                  <td style={tdStyle}>
                    {item.boardingHouse?.name || "N/A"}
                  </td>

                  <td style={tdStyle}>
                    Room {item.room?.roomNumber || "N/A"}
                  </td>

                  <td style={tdStyle}>{formatDate(item.appointmentDate)}</td>

                  <td style={tdStyle}>
                    <StatusBadge status={item.status} />
                  </td>

                  <td style={tdStyle}>
                    <ActionButtons
                      appointment={item}
                      detailLoadingId={detailLoadingId}
                      actionLoadingId={actionLoadingId}
                      onView={openDetail}
                      onAccept={openAcceptModal}
                      onReject={openRejectModal}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={emptyStyle}>
                  No appointments found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div style={paginationStyle}>
          <span style={subtitleStyle}>
            Showing {appointments.length} of {pagination.totalItems || 0}
          </span>

          <div style={pageButtonWrapStyle}>
            <button
              style={pageBtnStyle(!pagination.hasPrevPage || loading)}
              disabled={!pagination.hasPrevPage || loading}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            >
              Previous
            </button>

            <span style={pageTextStyle}>
              {pagination.currentPage || 1}/{pagination.totalPages || 1}
            </span>

            <button
              style={pageBtnStyle(!pagination.hasNextPage || loading)}
              disabled={!pagination.hasNextPage || loading}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {selected && (
        <div style={modalOverlayStyle} onMouseDown={() => setSelected(null)}>
          <div style={modalStyle} onMouseDown={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <h3 style={modalTitleStyle}>Appointment Detail</h3>
              <button style={closeBtnStyle} onClick={() => setSelected(null)}>
                x
              </button>
            </div>

            <div style={detailGridStyle}>
              <DetailItem label="User" value={selected.user?.fullname} />
              <DetailItem label="Email" value={selected.user?.email} />
              <DetailItem label="Phone" value={selected.user?.phoneNumber} />
              <DetailItem
                label="Boarding House"
                value={selected.boardingHouse?.name}
              />
              <DetailItem
                label="Room"
                value={`Room ${selected.room?.roomNumber || "N/A"}`}
              />
              <DetailItem
                label="Appointment Date"
                value={formatDate(selected.appointmentDate)}
              />
              <DetailItem
                label="Status"
                value={<StatusBadge status={selected.status} />}
              />
              <DetailItem label="Note" value={selected.note || "No note"} />
              <DetailItem
                label="Reason"
                value={selected.reasonForCancel || "N/A"}
              />
            </div>

            {selected.status === "pending" && (
              <div style={modalActionStyle}>
                <button
                  style={acceptTextBtnStyle}
                  disabled={actionLoadingId === selected._id}
                  onClick={() => openAcceptModal(selected)}
                >
                  Accept
                </button>

                <button
                  style={rejectTextBtnStyle}
                  disabled={actionLoadingId === selected._id}
                  onClick={() => openRejectModal(selected)}
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {acceptTarget && (
        <ActionConfirmModal
          title="Accept Appointment"
          description="Are you sure you want to accept this appointment?"
          target={acceptTarget}
          error={actionError}
          loading={actionLoadingId === acceptTarget._id}
          confirmText="Accept Appointment"
          confirmStyle={acceptTextBtnStyle}
          onClose={closeActionModal}
          onConfirm={handleAccept}
        />
      )}

      {rejectTarget && (
        <div style={modalOverlayStyle} onMouseDown={closeActionModal}>
          <div style={rejectModalStyle} onMouseDown={(e) => e.stopPropagation()}>
            <div style={modalHeaderStyle}>
              <h3 style={modalTitleStyle}>Reject Appointment</h3>
              <button style={closeBtnStyle} onClick={closeActionModal}>
                x
              </button>
            </div>

            <p style={subtitleStyle}>
              Please enter the reason for rejecting this appointment.
            </p>

            <AppointmentMiniInfo appointment={rejectTarget} />

            {actionError && <div style={errorBoxStyle}>{actionError}</div>}

            <textarea
              style={textareaStyle}
              value={rejectReason}
              maxLength={500}
              placeholder="Enter reject reason..."
              onChange={(e) => setRejectReason(e.target.value)}
            />

            <div style={counterStyle}>{rejectReason.length}/500</div>

            <div style={modalActionStyle}>
              <button style={clearBtnStyle} onClick={closeActionModal}>
                Cancel
              </button>

              <button
                style={rejectTextBtnStyle}
                disabled={actionLoadingId === rejectTarget._id}
                onClick={handleReject}
              >
                {actionLoadingId === rejectTarget._id
                  ? "Rejecting..."
                  : "Reject Appointment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function ActionButtons({
  appointment,
  detailLoadingId,
  actionLoadingId,
  onView,
  onAccept,
  onReject,
}) {
  const isPending = appointment.status === "pending";
  const loading = actionLoadingId === appointment._id;

  return (
    <div style={actionWrapStyle}>
      <button
        style={viewActionBtnStyle}
        type="button"
        disabled={detailLoadingId === appointment._id}
        onClick={() => onView(appointment._id)}
      >
        View
      </button>

      {isPending && (
        <>
          <button
            style={acceptActionBtnStyle}
            type="button"
            disabled={loading}
            onClick={() => onAccept(appointment)}
          >
            Accept
          </button>

          <button
            style={rejectActionBtnStyle}
            type="button"
            disabled={loading}
            onClick={() => onReject(appointment)}
          >
            Reject
          </button>
        </>
      )}
    </div>
  );
}

function ActionConfirmModal({
  title,
  description,
  target,
  error,
  loading,
  confirmText,
  confirmStyle,
  onClose,
  onConfirm,
}) {
  return (
    <div style={modalOverlayStyle} onMouseDown={onClose}>
      <div style={confirmModalStyle} onMouseDown={(e) => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <h3 style={modalTitleStyle}>{title}</h3>
          <button style={closeBtnStyle} onClick={onClose}>
            x
          </button>
        </div>

        <p style={subtitleStyle}>{description}</p>

        <AppointmentMiniInfo appointment={target} />

        {error && <div style={errorBoxStyle}>{error}</div>}

        <div style={modalActionStyle}>
          <button style={clearBtnStyle} onClick={onClose}>
            Cancel
          </button>

          <button style={confirmStyle} disabled={loading} onClick={onConfirm}>
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function AppointmentMiniInfo({ appointment }) {
  return (
    <div style={confirmBoxStyle}>
      <DetailItem
        label="User"
        value={appointment.user?.fullname || appointment.accountId?.fullname}
      />
      <DetailItem
        label="Room"
        value={`Room ${appointment.room?.roomNumber || "N/A"}`}
      />
      <DetailItem label="Date" value={formatDate(appointment.appointmentDate)} />
    </div>
  );
}

function StatusBadge({ status }) {
  const style = statusColor[status] || statusColor.pending;

  return (
    <span
      style={{
        ...badgeStyle,
        background: style.bg,
        color: style.color,
        borderColor: style.border,
      }}
    >
      {status || "pending"}
    </span>
  );
}

function DetailItem({ label, value }) {
  return (
    <div style={detailItemStyle}>
      <span style={detailLabelStyle}>{label}</span>
      <div style={detailValueStyle}>{value || "N/A"}</div>
    </div>
  );
}

const formatDate = (value) =>
  value ? new Date(value).toLocaleString("en-GB") : "N/A";

const headerStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  alignItems: "flex-start",
  marginBottom: 18,
  flexWrap: "wrap",
};

const titleStyle = { margin: 0, color: "#27364a", fontWeight: 700 };
const subtitleStyle = { color: "#667085", fontSize: 13 };

const summaryItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: "10px 14px",
  color: "#344054",
  fontWeight: 600,
};

const filterCardStyle = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: 14,
  marginBottom: 16,
};

const inputStyle = {
  flex: "1 1 260px",
  height: 40,
  border: "1px solid #d0d5dd",
  borderRadius: 6,
  padding: "0 12px",
  color: "#344054",
};

const selectStyle = {
  height: 40,
  border: "1px solid #d0d5dd",
  borderRadius: 6,
  padding: "0 12px",
  color: "#344054",
};

const dateInputStyle = {
  height: 40,
  border: "1px solid #d0d5dd",
  borderRadius: 6,
  padding: "0 12px",
  color: "#344054",
};

const searchBtnStyle = {
  height: 40,
  borderRadius: 6,
  border: "none",
  background: "#2563eb",
  color: "#fff",
  padding: "0 16px",
  fontWeight: 700,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

const clearBtnStyle = {
  height: 40,
  borderRadius: 6,
  border: "1px solid #d0d5dd",
  background: "#fff",
  color: "#344054",
  padding: "0 16px",
  fontWeight: 700,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

const tableCardStyle = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  overflow: "hidden",
  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
};

const tableStyle = { width: "100%", borderCollapse: "collapse" };
const headerRowStyle = {
  borderBottom: "1px solid #e5e7eb",
  background: "#f9fafb",
};
const rowStyle = { borderBottom: "1px solid #f3f4f6" };

const thStyle = {
  padding: 16,
  textAlign: "left",
  color: "#344054",
  fontWeight: 700,
  fontSize: 13,
};

const tdStyle = {
  padding: 16,
  color: "#344054",
  verticalAlign: "middle",
};

const mutedStyle = { color: "#98a2b3", fontSize: 12, marginTop: 4 };
const emptyStyle = { textAlign: "center", padding: 42, color: "#667085" };

const badgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  border: "1px solid",
  borderRadius: 999,
  padding: "5px 10px",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "capitalize",
};

const actionWrapStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
};

const baseActionBtnStyle = {
  height: 34,
  borderRadius: 6,
  padding: "0 12px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const viewActionBtnStyle = {
  ...baseActionBtnStyle,
  background: "#eef4ff",
  color: "#2563eb",
  border: "1px solid #bfdbfe",
};

const acceptActionBtnStyle = {
  ...baseActionBtnStyle,
  background: "#ecfdf3",
  color: "#087443",
  border: "1px solid #abefc6",
};

const rejectActionBtnStyle = {
  ...baseActionBtnStyle,
  background: "#fef3f2",
  color: "#b42318",
  border: "1px solid #fecdca",
};

const paginationStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 14,
  padding: "14px 16px",
  borderTop: "1px solid #e5e7eb",
  flexWrap: "wrap",
};

const pageButtonWrapStyle = { display: "flex", alignItems: "center", gap: 8 };

const pageTextStyle = {
  color: "#344054",
  fontWeight: 700,
  minWidth: 44,
  textAlign: "center",
};

const pageBtnStyle = (disabled) => ({
  padding: "8px 13px",
  borderRadius: 6,
  border: "1px solid #d0d5dd",
  background: disabled ? "#f2f4f7" : "#fff",
  color: disabled ? "#98a2b3" : "#344054",
  cursor: disabled ? "not-allowed" : "pointer",
  fontWeight: 700,
});

const modalOverlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  padding: 20,
};

const modalStyle = {
  background: "#fff",
  borderRadius: 8,
  width: "min(760px, 100%)",
  maxHeight: "88vh",
  overflow: "auto",
  padding: 22,
  boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
};

const rejectModalStyle = {
  background: "#fff",
  borderRadius: 8,
  width: "min(520px, 100%)",
  padding: 22,
  boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
};

const confirmModalStyle = {
  background: "#fff",
  borderRadius: 8,
  width: "min(520px, 100%)",
  padding: 22,
  boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
};

const modalHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginBottom: 16,
};

const modalTitleStyle = { margin: 0, color: "#27364a" };

const closeBtnStyle = {
  width: 32,
  height: 32,
  borderRadius: 6,
  border: "1px solid #d0d5dd",
  background: "#fff",
  cursor: "pointer",
  color: "#344054",
};

const detailGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 12,
};

const detailItemStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  marginBottom: 12,
};

const detailLabelStyle = {
  color: "#667085",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
};

const detailValueStyle = { color: "#344054", fontWeight: 600 };

const modalActionStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
  marginTop: 18,
};

const acceptTextBtnStyle = {
  height: 40,
  borderRadius: 6,
  border: "none",
  background: "#087443",
  color: "#fff",
  padding: "0 16px",
  fontWeight: 700,
  cursor: "pointer",
};

const rejectTextBtnStyle = {
  height: 40,
  borderRadius: 6,
  border: "none",
  background: "#d92d20",
  color: "#fff",
  padding: "0 16px",
  fontWeight: 700,
  cursor: "pointer",
};

const textareaStyle = {
  width: "100%",
  minHeight: 120,
  border: "1px solid #d0d5dd",
  borderRadius: 6,
  padding: 12,
  resize: "vertical",
  boxSizing: "border-box",
  color: "#344054",
  fontFamily: "inherit",
};

const counterStyle = {
  textAlign: "right",
  color: "#667085",
  fontSize: 12,
  marginTop: 6,
};

const errorBoxStyle = {
  background: "#fef3f2",
  color: "#b42318",
  border: "1px solid #fecdca",
  padding: "10px 12px",
  borderRadius: 6,
  marginBottom: 12,
  fontSize: 13,
};

const confirmBoxStyle = {
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: 12,
  margin: "12px 0",
};
