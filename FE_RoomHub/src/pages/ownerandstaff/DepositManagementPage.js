import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeDollarSign,
  Check,
  Eye,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import AdminLayout from "../layout/admin/AdminLayout";
import {
  deleteManagedDeposit,
  getManagedDeposits,
  updateManagedDepositDecision,
} from "../../api/managedDeposit";
import "./DepositManagementPage.css";

const statusOptions = [
  { value: "", label: "All status" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "confirmed", label: "Confirmed" },
  { value: "rejected", label: "Rejected" },
  { value: "refunded", label: "Refunded" },
];

const getTodayDateValue = () => {
  const today = new Date();
  const timezoneOffset = today.getTimezoneOffset() * 60000;
  return new Date(today.getTime() - timezoneOffset).toISOString().slice(0, 10);
};

const isFutureDate = (dateValue, todayValue) =>
  Boolean(dateValue && dateValue > todayValue);

export default function DepositManagementPage() {
  const [deposits, setDeposits] = useState([]);
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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selected, setSelected] = useState(null);
  const [acceptTarget, setAcceptTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionNotice, setActionNotice] = useState(null);
  const todayDate = getTodayDateValue();

  const query = useMemo(
    () => ({
      page,
      limit: pagination.limit,
      status,
      startDate,
      endDate,
    }),
    [page, pagination.limit, status, startDate, endDate]
  );

  const fetchDeposits = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      if (isFutureDate(startDate, todayDate) || isFutureDate(endDate, todayDate)) {
        setDeposits([]);
        setError("Date filters cannot be in the future.");
        return;
      }

      if (startDate && endDate && startDate > endDate) {
        setDeposits([]);
        setError("End date cannot be earlier than start date.");
        return;
      }

      const res = await getManagedDeposits(query);

      if (res?.success) {
        setDeposits(res.data || []);
        setPagination((prev) => ({
          ...prev,
          ...(res.pagination || {}),
        }));
      } else {
        setDeposits([]);
        setError(res?.message || "Unable to load deposit requests.");
      }
    } catch (err) {
      setDeposits([]);
      setError(err.message || "Unable to load deposit requests.");
    } finally {
      setLoading(false);
    }
  }, [query, startDate, endDate, todayDate]);

  useEffect(() => {
    fetchDeposits();
  }, [fetchDeposits]);

  const resetFilters = () => {
    setStatus("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const closeActionModal = () => {
    setAcceptTarget(null);
    setRejectTarget(null);
    setDeleteTarget(null);
    setRejectReason("");
    setActionError("");
  };

  const updateDepositStatus = (depositId, nextStatus) => {
    setDeposits((prev) =>
      prev.map((item) =>
        item._id === depositId ? { ...item, status: nextStatus } : item
      )
    );

    setSelected((prev) =>
      prev?._id === depositId ? { ...prev, status: nextStatus } : prev
    );
  };

  const handleAccept = async () => {
    if (!acceptTarget?._id) return;

    try {
      setActionLoadingId(acceptTarget._id);
      setActionError("");
      setActionNotice(null);

      const res = await updateManagedDepositDecision(acceptTarget._id, {
        action: "accept",
      });

      if (res?.success) {
        updateDepositStatus(acceptTarget._id, res.status || "accepted");
        setActionNotice({
          type: "success",
          message: "Chap nhan yeu cau dat coc thanh cong.",
        });
        closeActionModal();
        setSelected(null);
      } else {
        setActionError(res?.message || "Accept deposit request failed.");
      }
    } catch (err) {
      setActionError(err.message || "Accept deposit request failed.");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleReject = async () => {
    if (!rejectTarget?._id) return;

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
      setActionNotice(null);

      const res = await updateManagedDepositDecision(rejectTarget._id, {
        action: "reject",
        reasonForCancel: reason,
      });

      if (res?.success) {
        updateDepositStatus(rejectTarget._id, res.status || "rejected");
        setActionNotice({
          type: "danger",
          message: "Da tu choi yeu cau dat coc.",
        });
        closeActionModal();
        setSelected(null);
      } else {
        setActionError(res?.message || "Reject deposit request failed.");
      }
    } catch (err) {
      setActionError(err.message || "Reject deposit request failed.");
    } finally {
      setActionLoadingId("");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget?._id) return;

    try {
      setActionLoadingId(deleteTarget._id);
      setActionError("");
      setActionNotice(null);

      const res = await deleteManagedDeposit(deleteTarget._id);

      if (res?.success) {
        setDeposits((prev) => prev.filter((item) => item._id !== deleteTarget._id));
        setActionNotice({
          type: "success",
          message: "Xoa yeu cau dat coc thanh cong.",
        });
        closeActionModal();
        setSelected(null);
      } else {
        setActionError(res?.message || "Delete deposit request failed.");
      }
    } catch (err) {
      setActionError(err.message || "Delete deposit request failed.");
    } finally {
      setActionLoadingId("");
    }
  };

  return (
    <AdminLayout>
      <div className="deposit-page">
        <div className="deposit-header">
          <div className="deposit-title-wrap">
            <h2>Deposit Management</h2>
            <p>Review room deposit requests and handle approval decisions.</p>
          </div>

          <div className="deposit-summary">
            <BadgeDollarSign size={18} />
            <span>{pagination.totalItems || 0} requests</span>
          </div>
        </div>

        <div className="deposit-toolbar">
          <select
            className="deposit-control"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            {statusOptions.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <input
            className="deposit-control"
            type="date"
            value={startDate}
            max={todayDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
          />

          <input
            className="deposit-control"
            type="date"
            value={endDate}
            max={todayDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
          />

          <button
            className="deposit-btn deposit-btn-primary"
            type="button"
            disabled={loading}
            onClick={fetchDeposits}
          >
            <Search size={16} />
            Search
          </button>

          <button
            className="deposit-btn deposit-btn-ghost"
            type="button"
            disabled={loading}
            onClick={resetFilters}
          >
            <RefreshCw size={16} />
            Reset
          </button>
        </div>

        {actionNotice && (
          <div className={`deposit-alert deposit-alert-${actionNotice.type}`}>
            {actionNotice.message}
          </div>
        )}

        <div className="deposit-card">
          <div className="deposit-table-wrap">
            <table className="deposit-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Boarding House</th>
                  <th>Room</th>
                  <th>Amount</th>
                  <th>Rental</th>
                  <th>Status</th>
                  <th>Created At</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8">
                      <div className="deposit-empty">Loading deposit requests...</div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="8">
                      <div className="deposit-empty">{error}</div>
                    </td>
                  </tr>
                ) : deposits.length ? (
                  deposits.map((item) => (
                    <tr key={item._id}>
                      <td>
                        <div className="deposit-user">{item.name || "N/A"}</div>
                        <div className="deposit-muted">{item.email || "No email"}</div>
                      </td>
                      <td>{item.boardingHouseName || "N/A"}</td>
                      <td>Room {item.roomNumber || "N/A"}</td>
                      <td>
                        <span className="deposit-amount">
                          {formatMoney(item.amount)}
                        </span>
                      </td>
                      <td>
                        <strong>{item.rentalTime || 0} month(s)</strong>
                        <div className="deposit-muted">
                          {item.startDate || "N/A"} - {item.endDate || "N/A"}
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                      <td>{item.createdAt || "N/A"}</td>
                      <td>
                        <div className="deposit-actions">
                          <button
                            className="deposit-action-btn view"
                            type="button"
                            title="View detail"
                            onClick={() => setSelected(item)}
                          >
                            <Eye size={16} />
                          </button>

                          {item.status === "pending" && (
                            <>
                              <button
                                className="deposit-action-btn accept"
                                type="button"
                                title="Accept"
                                disabled={actionLoadingId === item._id}
                                onClick={() => {
                                  setActionNotice(null);
                                  setActionError("");
                                  setAcceptTarget(item);
                                }}
                              >
                                <Check size={16} />
                              </button>

                              <button
                                className="deposit-action-btn reject"
                                type="button"
                                title="Reject"
                                disabled={actionLoadingId === item._id}
                                onClick={() => {
                                  setActionNotice(null);
                                  setActionError("");
                                  setRejectReason("");
                                  setRejectTarget(item);
                                }}
                              >
                                <X size={16} />
                              </button>
                            </>
                          )}

                          {canDeleteDeposit(item.status) && (
                            <button
                              className="deposit-action-btn delete"
                              type="button"
                              title="Delete"
                              disabled={actionLoadingId === item._id}
                              onClick={() => {
                                setActionNotice(null);
                                setActionError("");
                                setDeleteTarget(item);
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8">
                      <div className="deposit-empty">No deposit requests found.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="deposit-pagination">
            <span className="deposit-muted">
              Showing {deposits.length} of {pagination.totalItems || 0}
            </span>

            <div className="deposit-page-actions">
              <button
                className="deposit-btn deposit-btn-ghost"
                type="button"
                disabled={!pagination.hasPrevPage || loading}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              >
                Previous
              </button>

              <span className="deposit-page-label">
                {pagination.currentPage || 1}/{pagination.totalPages || 1}
              </span>

              <button
                className="deposit-btn deposit-btn-ghost"
                type="button"
                disabled={!pagination.hasNextPage || loading}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {selected && (
        <DetailModal
          deposit={selected}
          onClose={() => setSelected(null)}
          onAccept={() => {
            setActionNotice(null);
            setActionError("");
            setAcceptTarget(selected);
          }}
          onReject={() => {
            setActionNotice(null);
            setActionError("");
            setRejectReason("");
            setRejectTarget(selected);
          }}
          onDelete={() => {
            setActionNotice(null);
            setActionError("");
            setDeleteTarget(selected);
          }}
        />
      )}

      {acceptTarget && (
        <ConfirmModal
          title="Accept Deposit Request"
          description="This will approve the user's deposit request and send an email notification."
          deposit={acceptTarget}
          error={actionError}
          loading={actionLoadingId === acceptTarget._id}
          confirmText="Accept Request"
          confirmClassName="deposit-btn-success"
          onClose={closeActionModal}
          onConfirm={handleAccept}
        />
      )}

      {rejectTarget && (
        <RejectModal
          deposit={rejectTarget}
          reason={rejectReason}
          error={actionError}
          loading={actionLoadingId === rejectTarget._id}
          onReasonChange={setRejectReason}
          onClose={closeActionModal}
          onConfirm={handleReject}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete Deposit Request"
          description="This will permanently remove this deposit request from the system."
          deposit={deleteTarget}
          error={actionError}
          loading={actionLoadingId === deleteTarget._id}
          confirmText="Delete Request"
          confirmClassName="deposit-btn-danger"
          onClose={closeActionModal}
          onConfirm={handleDelete}
        />
      )}
    </AdminLayout>
  );
}

function DetailModal({ deposit, onClose, onAccept, onReject, onDelete }) {
  return (
    <div className="deposit-modal-backdrop" onMouseDown={onClose}>
      <div className="deposit-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="deposit-modal-header">
          <h3>Deposit Detail</h3>
          <button className="deposit-close" type="button" onClick={onClose}>
            x
          </button>
        </div>

        <div className="deposit-detail-grid">
          <DetailItem label="User" value={deposit.name} />
          <DetailItem label="Email" value={deposit.email} />
          <DetailItem label="Boarding House" value={deposit.boardingHouseName} />
          <DetailItem label="Room" value={`Room ${deposit.roomNumber || "N/A"}`} />
          <DetailItem label="Amount" value={formatMoney(deposit.amount)} />
          <DetailItem label="Rental Time" value={`${deposit.rentalTime || 0} month(s)`} />
          <DetailItem label="Start Date" value={deposit.startDate} />
          <DetailItem label="End Date" value={deposit.endDate} />
          <DetailItem label="Created At" value={deposit.createdAt} />
          <DetailItem label="Status" value={<StatusBadge status={deposit.status} />} />
        </div>

        {deposit.status === "pending" && (
          <div className="deposit-modal-actions">
            <button
              className="deposit-btn deposit-btn-success"
              type="button"
              onClick={onAccept}
            >
              Accept
            </button>

            <button
              className="deposit-btn deposit-btn-danger"
              type="button"
              onClick={onReject}
            >
              Reject
            </button>
          </div>
        )}

        {canDeleteDeposit(deposit.status) && (
          <div className="deposit-modal-actions">
            <button
              className="deposit-btn deposit-btn-danger"
              type="button"
              onClick={onDelete}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ConfirmModal({
  title,
  description,
  deposit,
  error,
  loading,
  confirmText,
  confirmClassName,
  onClose,
  onConfirm,
}) {
  return (
    <div className="deposit-modal-backdrop" onMouseDown={onClose}>
      <div
        className="deposit-modal deposit-modal-sm"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="deposit-modal-header">
          <h3>{title}</h3>
          <button className="deposit-close" type="button" onClick={onClose}>
            x
          </button>
        </div>

        <p className="deposit-muted">{description}</p>
        <DepositMiniInfo deposit={deposit} />

        {error && <div className="deposit-alert">{error}</div>}

        <div className="deposit-modal-actions">
          <button className="deposit-btn deposit-btn-ghost" type="button" onClick={onClose}>
            Cancel
          </button>

          <button
            className={`deposit-btn ${confirmClassName}`}
            type="button"
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function RejectModal({
  deposit,
  reason,
  error,
  loading,
  onReasonChange,
  onClose,
  onConfirm,
}) {
  return (
    <div className="deposit-modal-backdrop" onMouseDown={onClose}>
      <div
        className="deposit-modal deposit-modal-sm"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="deposit-modal-header">
          <h3>Reject Deposit Request</h3>
          <button className="deposit-close" type="button" onClick={onClose}>
            x
          </button>
        </div>

        <DepositMiniInfo deposit={deposit} />

        {error && <div className="deposit-alert">{error}</div>}

        <textarea
          className="deposit-textarea"
          maxLength={500}
          value={reason}
          placeholder="Enter reject reason..."
          onChange={(e) => onReasonChange(e.target.value)}
        />
        <div className="deposit-muted">{reason.length}/500</div>

        <div className="deposit-modal-actions">
          <button className="deposit-btn deposit-btn-ghost" type="button" onClick={onClose}>
            Cancel
          </button>

          <button
            className="deposit-btn deposit-btn-danger"
            type="button"
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? "Rejecting..." : "Reject Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DepositMiniInfo({ deposit }) {
  return (
    <div className="deposit-detail-grid">
      <DetailItem label="User" value={deposit.name} />
      <DetailItem label="Room" value={`Room ${deposit.roomNumber || "N/A"}`} />
      <DetailItem label="Amount" value={formatMoney(deposit.amount)} />
      <DetailItem label="Boarding House" value={deposit.boardingHouseName} />
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="deposit-detail-item">
      <span className="deposit-detail-label">{label}</span>
      <div className="deposit-detail-value">{value || "N/A"}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`deposit-badge deposit-badge-${status || "pending"}`}>
      {status || "pending"}
    </span>
  );
}

const canDeleteDeposit = (status) =>
  ["rejected", "accepted", "confirmed"].includes(String(status || "").toLowerCase());

const formatMoney = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
