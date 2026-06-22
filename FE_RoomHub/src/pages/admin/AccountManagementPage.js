import { useEffect, useState, useCallback } from "react";
import AdminLayout from "../layout/admin/AdminLayout";
import {
  getAllAccountsAPI,
  filterAccountsAPI,
  softDeleteAccountAPI,
  updateAccountAPI,
  createAccountAPI,
} from "../../api/accountAPI";

// ── helpers ──────────────────────────────────────────────────────────────────
const ROLE_COLORS = {
  admin:  { bg: "#fce7f3", color: "#be185d" },
  owner:  { bg: "#ede9fe", color: "#6d28d9" },
  staff:  { bg: "#dbeafe", color: "#1d4ed8" },
  user:   { bg: "#d1fae5", color: "#065f46" },
};

// ── main component ────────────────────────────────────────────────────────────
export default function AccountManagementPage() {
  const [accounts, setAccounts]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [pagination, setPagination]     = useState({ currentPage: 1, totalPages: 1, totalItems: 0, limit: 10 });
  const [filterValue, setFilterValue]   = useState({});
  const [paginationOpts, setPaginationOpts] = useState({ page: 1, limit: 10, sortField: "createdAt", sortOrder: "desc" });
  const [currentUserRole, setCurrentUserRole] = useState('admin');

  // modals
  const [showFilter, setShowFilter]     = useState(false);
  const [showAdd, setShowAdd]           = useState(false);
  const [editAccount, setEditAccount]   = useState(null);   // UpdateModal
  const [confirmId, setConfirmId]       = useState(null);   // DeleteModal

  useEffect(() => {
    const role = localStorage.getItem('userRole') || 'admin';
    setCurrentUserRole(role);
  }, []);

  // ── data fetching ───────────────────────────────────────────────────────────
  const fetchAccounts = useCallback(() => {
    setLoading(true);
    const params = { ...filterValue, ...paginationOpts };
    filterAccountsAPI(params)
      .then((res) => {
        if (res?.data) {
          setAccounts(res.data);
          setPagination(res.pagination ?? { currentPage: 1, totalPages: 1, totalItems: res.data.length, limit: 10 });
        } else {
          // fallback: getAllAccounts (no pagination)
          return getAllAccountsAPI().then((data) => {
            setAccounts(Array.isArray(data) ? data : []);
          });
        }
      })
      .catch(() => setAccounts([]))
      .finally(() => setLoading(false));
  }, [filterValue, paginationOpts]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  // ── actions ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      await softDeleteAccountAPI(confirmId);
      fetchAccounts();
      alert("Account deactivated successfully.");
    } catch (err) {
      console.error("Delete error:", err);
      alert(err?.response?.data?.message || "Failed to deactivate account.");
    }
    finally { setConfirmId(null); }
  };

  const handleUpdate = async (data) => {
    try {
      await updateAccountAPI(editAccount._id, data);
      fetchAccounts();
      setEditAccount(null);
      alert("Account updated successfully.");
    } catch (err) {
      console.error("Update error:", err);
      alert(err?.response?.data?.message || "Failed to update account.");
    }
  };

  const handleCreate = async (data) => {
    try {
      await createAccountAPI(data);
      fetchAccounts();
      setShowAdd(false);
      alert("Account created successfully.");
    } catch (err) {
      console.error("Create error:", err);
      alert(err?.response?.data?.message || "Failed to create account.");
    }
  };

  const applyFilter = (vals) => {
    setFilterValue(vals);
    setPaginationOpts((p) => ({ ...p, page: 1 }));
    setShowFilter(false);
  };

  return (
    <AdminLayout>
      {/* ── header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2 style={{ fontWeight: 700, color: "#27364a", margin: 0 }}>Account Management</h2>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setShowAdd(true)} style={addBtnStyle}>+ Add New</button>
          <button onClick={() => setShowFilter(!showFilter)} style={filterBtnStyle}>Filter</button>
        </div>
      </div>

      {/* ── filter panel ── */}
      {showFilter && (
        <FilterPanel
          onApply={applyFilter}
          onClear={() => { setFilterValue({}); setShowFilter(false); fetchAccounts(); }}
        />
      )}

      {/* ── table ── */}
      <div style={{ background: "white", borderRadius: 10, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              {["No.", "Full Name", "Username", "Email", "Gender", "Role", "Joined", "Actions"].map((h) => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="9" style={emptyStyle}>Loading...</td></tr>
            ) : accounts.length === 0 ? (
              <tr><td colSpan="9" style={emptyStyle}>No accounts found</td></tr>
            ) : (
              accounts.map((acc, i) => {
                const rs = ROLE_COLORS[acc.role] || { bg: "#f3f4f6", color: "#374151" };
                return (
                  <tr key={acc._id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <td style={tdStyle}>{(paginationOpts.page - 1) * paginationOpts.limit + i + 1}</td>
                    <td style={{ ...tdStyle, fontWeight: 600 }}>{acc.fullname || "N/A"}</td>
                    <td style={tdStyle}>{acc.username || "N/A"}</td>
                    <td style={tdStyle}>{acc.email || "N/A"}</td>
                    <td style={tdStyle} className="capitalize">{acc.gender || "N/A"}</td>
                    <td style={tdStyle}>
                      <span style={{ background: rs.bg, color: rs.color, padding: "4px 12px", borderRadius: 20, fontSize: 13, fontWeight: 600, textTransform: "capitalize" }}>
                        {acc.role}
                      </span>
                    </td>
                    <td style={tdStyle}>{acc.createdAt ? new Date(acc.createdAt).toLocaleDateString("en-GB") : "N/A"}</td>
                    <td style={{ ...tdStyle, display: "flex", gap: 8 }}>
                      <button onClick={() => setEditAccount(acc)} style={editBtnStyle}>Update</button>
                      <button
                        onClick={() => acc.role !== "admin" && setConfirmId(acc._id)}
                        disabled={acc.role === "admin"}
                        style={acc.role === "admin" ? disabledBtnStyle : deleteBtnStyle}
                      >
                        Deactivate
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* ── pagination ── */}
        {pagination.totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", padding: "14px 18px", gap: 8 }}>
            <button
              onClick={() => setPaginationOpts((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
              disabled={paginationOpts.page === 1}
              style={pageBtn(paginationOpts.page === 1)}
            >← Prev</button>
            <span style={{ color: "#667085", fontSize: 14 }}>Page {paginationOpts.page} / {pagination.totalPages}</span>
            <button
              onClick={() => setPaginationOpts((p) => ({ ...p, page: Math.min(pagination.totalPages, p.page + 1) }))}
              disabled={paginationOpts.page === pagination.totalPages}
              style={pageBtn(paginationOpts.page === pagination.totalPages)}
            >Next →</button>
          </div>
        )}
      </div>

      {/* ── modals ── */}
      {showAdd    && <AddAccountModal onSubmit={handleCreate} onClose={() => setShowAdd(false)} currentUserRole={currentUserRole} />}
      {editAccount && <UpdateAccountModal account={editAccount} onSubmit={handleUpdate} onClose={() => setEditAccount(null)} />}
      {confirmId  && <ConfirmModal onConfirm={handleDelete} onCancel={() => setConfirmId(null)} />}
    </AdminLayout>
  );
}

// ── FilterPanel ───────────────────────────────────────────────────────────────
function FilterPanel({ onApply, onClear }) {
  const [gender, setGender]       = useState("");
  const [role, setRole]           = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate]     = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (startDate && !endDate) return alert("Please select an end date.");
    if (endDate && !startDate) return alert("Please select a start date.");
    if (startDate && endDate && startDate > endDate) return alert("Start date must be before end date.");
    onApply({ gender, role, startDate, endDate });
  };

  return (
    <form onSubmit={handleSubmit} style={{ background: "white", borderRadius: 10, padding: "20px 24px", marginBottom: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", display: "flex", flexWrap: "wrap", gap: 14, alignItems: "flex-end" }}>
      <div style={formGroup}>
        <label style={labelStyle}>Gender</label>
        <select value={gender} onChange={(e) => setGender(e.target.value)} style={selectStyle}>
          <option value="">All</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div style={formGroup}>
        <label style={labelStyle}>Role</label>
        <select value={role} onChange={(e) => setRole(e.target.value)} style={selectStyle}>
          <option value="">All</option>
          <option value="user">User</option>
          <option value="owner">Owner</option>
          <option value="staff">Staff</option>
        </select>
      </div>
      <div style={formGroup}>
        <label style={labelStyle}>From</label>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={selectStyle} />
      </div>
      <div style={formGroup}>
        <label style={labelStyle}>To</label>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={selectStyle} />
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button type="submit" style={filterBtnStyle}>Apply</button>
        <button type="button" onClick={onClear} style={clearBtnStyle}>Clear</button>
      </div>
    </form>
  );
}

// ── AddAccountModal (2-step) ──────────────────────────────────────────────────
function AddAccountModal({ onSubmit, onClose, currentUserRole = 'admin' }) {
  const [step, setStep]       = useState(1);
  const [step1, setStep1]     = useState({ fullname: "", email: "", gender: "male", phoneNumber: "" });
  const [step2, setStep2]     = useState({ username: "", password: "", confirmPassword: "", role: "user" });
  const [errors, setErrors]   = useState({});

  const getRoleOptions = () => {
    if (currentUserRole === 'admin') {
      return ['user', 'owner', 'staff'];
    }
    return ['user', 'owner'];
  };

  const validateStep1 = () => {
    const e = {};
    if (!step1.fullname.trim())  e.fullname    = "Full name is required.";
    if (!step1.email.trim())     e.email       = "Email is required.";
    if (!step1.phoneNumber.match(/^[0-9]{10,11}$/)) e.phoneNumber = "Phone must be 10-11 digits.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    if (!step2.username.trim())       e.username = "Username is required.";
    if (step2.password.length < 6)    e.password = "Password must be at least 6 characters.";
    if (step2.password !== step2.confirmPassword) e.confirmPassword = "Passwords do not match.";
    if (!step2.role)                  e.role = "Role is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => { if (validateStep1()) setStep(2); };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateStep2()) return;
    const { confirmPassword, ...rest } = step2;
    onSubmit({ ...step1, ...rest });
  };

  return (
    <div style={overlayStyle}>
      <div style={{ ...modalStyle, width: 480 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, color: "#27364a" }}>Create Account — Step {step}/2</h3>
          <button onClick={onClose} style={closeBtnStyle}>✕</button>
        </div>

        {step === 1 && (
          <div>
            {[["fullname","Full Name","text"],["email","Email","email"],["phoneNumber","Phone Number","text"]].map(([k,l,t]) => (
              <div key={k} style={formGroup}>
                <label style={labelStyle}>{l}</label>
                <input type={t} value={step1[k]} onChange={(e) => setStep1({ ...step1, [k]: e.target.value })} style={inputStyle} />
                {errors[k] && <span style={errStyle}>{errors[k]}</span>}
              </div>
            ))}
            <div style={formGroup}>
              <label style={labelStyle}>Gender</label>
              <select value={step1.gender} onChange={(e) => setStep1({ ...step1, gender: e.target.value })} style={selectStyle}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              <button onClick={handleNext} style={addBtnStyle}>Next →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit}>
            {[["username","Username","text"],["password","Password","password"],["confirmPassword","Confirm Password","password"]].map(([k,l,t]) => (
              <div key={k} style={formGroup}>
                <label style={labelStyle}>{l}</label>
                <input type={t} value={step2[k]} onChange={(e) => setStep2({ ...step2, [k]: e.target.value })} style={inputStyle} />
                {errors[k] && <span style={errStyle}>{errors[k]}</span>}
              </div>
            ))}
            <div style={formGroup}>
              <label style={labelStyle}>Role</label>
              <select value={step2.role} onChange={(e) => setStep2({ ...step2, role: e.target.value })} style={selectStyle}>
                {getRoleOptions().map(role => (
                  <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                ))}
              </select>
              {errors.role && <span style={errStyle}>{errors.role}</span>}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
              <button type="button" onClick={() => setStep(1)} style={cancelBtnStyle}>← Back</button>
              <button type="submit" style={addBtnStyle}>Create Account</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── UpdateAccountModal ────────────────────────────────────────────────────────
function UpdateAccountModal({ account, onSubmit, onClose }) {
  const [form, setForm] = useState({
    fullname:    account.fullname    || "",
    phoneNumber: account.phoneNumber || "",
    gender:      account.gender      || "male",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.fullname.trim()) return alert("Full name is required.");
    if (form.phoneNumber && !form.phoneNumber.match(/^[0-9]{10,11}$/)) return alert("Phone must be 10-11 digits.");
    onSubmit(form);
  };

  return (
    <div style={overlayStyle}>
      <div style={{ ...modalStyle, width: 480 }}>
        <form onSubmit={handleSubmit}>
          <div style={formGroup}>
            <label style={labelStyle}>Full Name</label>
            <input value={form.fullname} onChange={(e) => setForm({ ...form, fullname: e.target.value })} style={inputStyle} />
          </div>
          <div style={formGroup}>
            <label style={labelStyle}>Phone Number</label>
            <input value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} style={inputStyle} />
          </div>
          <div style={formGroup}>
            <label style={labelStyle}>Gender</label>
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} style={selectStyle}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>Cancel</button>
            <button type="submit" style={editBtnStyle}>Update</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── ConfirmModal ──────────────────────────────────────────────────────────────
function ConfirmModal({ onConfirm, onCancel }) {
  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h3 style={{ margin: "0 0 10px", color: "#27364a" }}>Deactivate Account</h3>
        <p style={{ color: "#667085", marginBottom: 24 }}>Are you sure? The user will no longer be able to log in.</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={cancelBtnStyle}>Cancel</button>
          <button onClick={onConfirm} style={deleteBtnStyle}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────
const thStyle    = { padding: "16px 18px", textAlign: "left", color: "#344054", fontWeight: 700, fontSize: 14 };
const tdStyle    = { padding: "14px 18px", color: "#344054", fontSize: 14 };
const emptyStyle = { textAlign: "center", padding: 48, color: "#667085" };
const formGroup  = { display: "flex", flexDirection: "column", gap: 4, marginBottom: 14, flex: "1 1 160px" };
const labelStyle = { fontSize: 13, fontWeight: 600, color: "#344054" };
const errStyle   = { fontSize: 12, color: "#dc2626" };
const inputStyle = { padding: "9px 14px", border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, color: "#344054", outline: "none", width: "100%" };
const selectStyle= { ...inputStyle, cursor: "pointer", background: "white" };
const addBtnStyle    = { background: "#12b76a", color: "white", border: "none", padding: "9px 20px", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 14 };
const filterBtnStyle = { background: "#2f80ed", color: "white", border: "none", padding: "9px 20px", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 14 };
const clearBtnStyle  = { background: "#fee2e2", color: "#dc2626", border: "none", padding: "9px 20px", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 14 };
const editBtnStyle   = { background: "#2f80ed", color: "white", border: "none", padding: "7px 14px", borderRadius: 6, fontWeight: 600, cursor: "pointer", fontSize: 13 };
const deleteBtnStyle = { background: "#fee2e2", color: "#dc2626", border: "none", padding: "7px 14px", borderRadius: 6, fontWeight: 600, cursor: "pointer", fontSize: 13 };
const disabledBtnStyle = { background: "#e5e7eb", color: "#9ca3af", border: "none", padding: "7px 14px", borderRadius: 6, fontWeight: 600, cursor: "not-allowed", fontSize: 13 };
const cancelBtnStyle = { padding: "9px 20px", borderRadius: 6, border: "1px solid #e5e7eb", background: "white", color: "#344054", fontWeight: 600, cursor: "pointer" };
const closeBtnStyle  = { background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#667085" };
const overlayStyle   = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const modalStyle     = { background: "white", borderRadius: 12, padding: "28px 32px", width: 400, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", maxHeight: "90vh", overflowY: "auto" };
const pageBtn = (disabled) => ({ padding: "7px 14px", borderRadius: 6, border: "1px solid #e5e7eb", background: disabled ? "#f3f4f6" : "white", color: disabled ? "#9ca3af" : "#344054", fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer" });
