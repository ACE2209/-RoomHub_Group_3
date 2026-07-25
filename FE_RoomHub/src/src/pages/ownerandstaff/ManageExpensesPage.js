import { useEffect, useState } from "react";
import {
  getExpensesByTime,
  addExpense,
  updateExpense,
  deleteExpense,
} from "../../api/ownerandstaff/expenseAPI";
import { getOwnBoardingHouses } from "../../api/boardingHouse";
import AdminLayout from "../layout/admin/AdminLayout";

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - i);

const EMPTY_METER = { oldNumber: "", newNumber: "", totalAmount: "" };

const EMPTY_FORM = {
  electricalExpense: { ...EMPTY_METER },
  waterExpense: { ...EMPTY_METER },
  otherExpenses: [],
};

const toMeterForm = (meter) => ({
  oldNumber: meter?.oldNumber ?? "",
  newNumber: meter?.newNumber ?? "",
  totalAmount: meter?.totalAmount ?? "",
});

const toMeterPayload = (meter) => ({
  oldNumber: Number(meter.oldNumber || 0),
  newNumber: Number(meter.newNumber || 0),
  totalAmount: Number(meter.totalAmount || 0),
});

const getTotalExpense = (expense) => {
  const otherTotal = (expense.otherExpenses || []).reduce(
    (sum, item) => sum + Number(item.feeAmount || 0),
    0
  );

  return (
    Number(expense.electricalExpense?.totalAmount || 0) +
    Number(expense.waterExpense?.totalAmount || 0) +
    otherTotal
  );
};

export default function ManageExpensesPage() {
  const [boardingHouses, setBoardingHouses] = useState([]);
  const [selectedBoardingHouse, setSelectedBoardingHouse] = useState("");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(CURRENT_YEAR);

  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const loadBoardingHouses = async () => {
    try {
      const res = await getOwnBoardingHouses({ page: 1, limit: 100 });
      const houses = res?.data || [];

      setBoardingHouses(houses);

      if (houses.length > 0) {
        setSelectedBoardingHouse(houses[0]._id);
      }
    } catch (error) {
      alert(error.message || "Load boarding houses failed");
    }
  };

  const loadExpense = async () => {
    if (!selectedBoardingHouse) return;

    try {
      setLoading(true);
      const res = await getExpensesByTime(selectedBoardingHouse, month, year);
      setExpense(res?.data?.[0] || null);
    } catch (error) {
      alert(error.message || "Load expenses failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoardingHouses();
  }, []);

  useEffect(() => {
    loadExpense();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBoardingHouse, month, year]);

  const openAddForm = () => {
    setEditingExpense(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEditForm = (item) => {
    setEditingExpense(item);
    setForm({
      electricalExpense: toMeterForm(item.electricalExpense),
      waterExpense: toMeterForm(item.waterExpense),
      otherExpenses: (item.otherExpenses || []).map((fee) => ({
        feeName: fee.feeName || "",
        feeAmount: fee.feeAmount ?? "",
      })),
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingExpense(null);
    setForm(EMPTY_FORM);
  };

  const updateMeterField = (meterKey, field, value) => {
    setForm((prev) => ({
      ...prev,
      [meterKey]: { ...prev[meterKey], [field]: value },
    }));
  };

  const updateOtherExpense = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      otherExpenses: prev.otherExpenses.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addOtherExpenseRow = () => {
    setForm((prev) => ({
      ...prev,
      otherExpenses: [...prev.otherExpenses, { feeName: "", feeAmount: "" }],
    }));
  };

  const removeOtherExpenseRow = (index) => {
    setForm((prev) => ({
      ...prev,
      otherExpenses: prev.otherExpenses.filter((_, i) => i !== index),
    }));
  };

  const validateMeter = (meter, name) => {
    if (meter.oldNumber === "" || meter.newNumber === "" || meter.totalAmount === "") {
      alert(`Please fill in all ${name} fields`);
      return false;
    }

    if (Number(meter.newNumber) < Number(meter.oldNumber)) {
      alert(`${name}: new meter number must not be less than old number`);
      return false;
    }

    return true;
  };

  const submitForm = async () => {
    if (!validateMeter(form.electricalExpense, "electricity expense")) return;
    if (!validateMeter(form.waterExpense, "water expense")) return;

    for (const fee of form.otherExpenses) {
      if (!String(fee.feeName).trim() || fee.feeAmount === "") {
        alert("Please fill in all other expense rows or remove empty ones");
        return;
      }
    }

    const payload = {
      electricalExpense: toMeterPayload(form.electricalExpense),
      waterExpense: toMeterPayload(form.waterExpense),
      otherExpenses: form.otherExpenses.map((fee) => ({
        feeName: String(fee.feeName).trim(),
        feeAmount: Number(fee.feeAmount || 0),
      })),
    };

    try {
      setSubmitting(true);

      if (editingExpense) {
        await updateExpense(editingExpense._id, payload);
        alert("Expense updated successfully");
      } else {
        await addExpense({
          ...payload,
          boardingHouseId: selectedBoardingHouse,
          month,
          year,
        });
        alert("Expense added successfully");
      }

      closeForm();
      loadExpense();
    } catch (error) {
      alert(error.message || "Save expense failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Delete the expense of ${item.month}/${item.year}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setSubmitting(true);
      await deleteExpense(item._id);

      alert("Expense deleted successfully");
      loadExpense();
    } catch (error) {
      alert(error.message || "Delete expense failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div style={styles.page}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Monthly Expenses</h1>
            <p style={styles.subtitle}>
              Manage electricity, water and other expenses of your boarding
              houses.
            </p>
          </div>

          {!loading && !expense && selectedBoardingHouse && (
            <button type="button" onClick={openAddForm} style={styles.addBtn}>
              + Add Expense
            </button>
          )}
        </div>

        <div style={styles.filterRow}>
          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>Boarding House</label>
            <select
              value={selectedBoardingHouse}
              onChange={(e) => setSelectedBoardingHouse(e.target.value)}
              style={styles.filter}
            >
              {boardingHouses.length === 0 && (
                <option value="">No boarding house</option>
              )}
              {boardingHouses.map((bh) => (
                <option key={bh._id} value={bh._id}>
                  {bh.name || "N/A"}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>Month</label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              style={styles.filter}
            >
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  Month {m}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.filterItem}>
            <label style={styles.filterLabel}>Year</label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              style={styles.filter}
            >
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div style={styles.emptyBox}>Loading...</div>
        ) : !expense ? (
          <div style={styles.emptyBox}>
            No expense recorded for {month}/{year}. Use "Add Expense" to create
            one.
          </div>
        ) : (
          <div style={styles.card}>
            <div style={styles.cardTop}>
              <div style={styles.periodLine}>
                Expense of {expense.month}/{expense.year}
              </div>

              <div style={styles.totalBadge}>
                Total: {formatCurrency(getTotalExpense(expense))}
              </div>
            </div>

            <div style={styles.meterGrid}>
              <MeterCard title="Electricity" meter={expense.electricalExpense} />
              <MeterCard title="Water" meter={expense.waterExpense} />
            </div>

            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Other Expenses</h3>

              {expense.otherExpenses?.length > 0 ? (
                <div style={styles.otherList}>
                  {expense.otherExpenses.map((fee, index) => (
                    <div key={index} style={styles.otherItem}>
                      <span>{fee.feeName || "N/A"}</span>
                      <b>{formatCurrency(fee.feeAmount)}</b>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={styles.noOther}>No other expense.</p>
              )}
            </div>

            <div style={styles.actions}>
              <button
                type="button"
                onClick={() => handleDelete(expense)}
                disabled={submitting}
                style={styles.deleteBtn}
              >
                Delete
              </button>

              <button
                type="button"
                onClick={() => openEditForm(expense)}
                disabled={submitting}
                style={styles.editBtn}
              >
                Update
              </button>
            </div>
          </div>
        )}

        {formOpen && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <h2 style={styles.modalTitle}>
                {editingExpense
                  ? `Update Expense ${month}/${year}`
                  : `Add Expense ${month}/${year}`}
              </h2>

              <MeterForm
                title="Electricity"
                meter={form.electricalExpense}
                onChange={(field, value) =>
                  updateMeterField("electricalExpense", field, value)
                }
              />

              <MeterForm
                title="Water"
                meter={form.waterExpense}
                onChange={(field, value) =>
                  updateMeterField("waterExpense", field, value)
                }
              />

              <label style={styles.label}>Other Expenses</label>

              {form.otherExpenses.length === 0 && (
                <p style={styles.noOther}>No other expense added.</p>
              )}

              <div style={styles.otherFormList}>
                {form.otherExpenses.map((fee, index) => (
                  <div key={index} style={styles.otherFormRow}>
                    <input
                      value={fee.feeName}
                      onChange={(e) =>
                        updateOtherExpense(index, "feeName", e.target.value)
                      }
                      placeholder="Expense name"
                      style={styles.otherNameInput}
                    />

                    <input
                      type="number"
                      min="0"
                      value={fee.feeAmount}
                      onChange={(e) =>
                        updateOtherExpense(index, "feeAmount", e.target.value)
                      }
                      placeholder="Amount"
                      style={styles.otherAmountInput}
                    />

                    <button
                      type="button"
                      onClick={() => removeOtherExpenseRow(index)}
                      style={styles.removeRowBtn}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addOtherExpenseRow}
                style={styles.addRowBtn}
              >
                + Add Other Expense
              </button>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={submitting}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={submitForm}
                  disabled={submitting}
                  style={styles.saveBtn}
                >
                  {submitting
                    ? "Saving..."
                    : editingExpense
                    ? "Update Expense"
                    : "Add Expense"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function MeterCard({ title, meter }) {
  return (
    <div style={styles.meterCard}>
      <h3 style={styles.sectionTitle}>{title}</h3>

      <div style={styles.meterInfoGrid}>
        <Info label="Old number" value={meter?.oldNumber ?? "N/A"} />
        <Info label="New number" value={meter?.newNumber ?? "N/A"} />
        <Info label="Consumed" value={meter?.quantityConsumed ?? "N/A"} />
        <Info label="Amount" value={formatCurrency(meter?.totalAmount)} />
      </div>
    </div>
  );
}

function MeterForm({ title, meter, onChange }) {
  return (
    <div style={styles.meterFormBox}>
      <label style={styles.label}>{title} *</label>

      <div style={styles.meterFormGrid}>
        <input
          type="number"
          min="0"
          value={meter.oldNumber}
          onChange={(e) => onChange("oldNumber", e.target.value)}
          placeholder="Old number"
          style={styles.meterInput}
        />

        <input
          type="number"
          min="0"
          value={meter.newNumber}
          onChange={(e) => onChange("newNumber", e.target.value)}
          placeholder="New number"
          style={styles.meterInput}
        />

        <input
          type="number"
          min="0"
          value={meter.totalAmount}
          onChange={(e) => onChange("totalAmount", e.target.value)}
          placeholder="Total amount"
          style={styles.meterInput}
        />
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div style={styles.infoBox}>
      <span style={styles.infoLabel}>{label}</span>
      <b style={styles.infoValue}>{value}</b>
    </div>
  );
}

const styles = {
  page: {
    padding: 24,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "center",
    marginBottom: 18,
  },
  title: {
    margin: 0,
    fontSize: 28,
    color: "#27364a",
  },
  subtitle: {
    color: "#667085",
    marginTop: 6,
  },
  filterRow: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr 1fr",
    gap: 16,
    marginBottom: 22,
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    padding: 18,
    boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
  },
  filterItem: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  filterLabel: {
    fontSize: 12,
    color: "#667085",
    fontWeight: 800,
    textTransform: "uppercase",
  },
  filter: {
    height: 42,
    borderRadius: 8,
    border: "1px solid #d0d5dd",
    padding: "0 12px",
    color: "#344054",
    background: "#fff",
  },
  card: {
    background: "#fff",
    borderRadius: 16,
    border: "1px solid #e5e7eb",
    padding: 22,
    boxShadow: "0 6px 18px rgba(0,0,0,0.05)",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: 14,
    alignItems: "center",
    marginBottom: 14,
  },
  periodLine: {
    fontSize: 18,
    fontWeight: 800,
    color: "#27364a",
  },
  totalBadge: {
    background: "#ecfdf3",
    color: "#087443",
    border: "1px solid #abefc6",
    borderRadius: 999,
    padding: "8px 14px",
    fontWeight: 800,
  },
  meterGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 14,
  },
  meterCard: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: 12,
    padding: 14,
  },
  meterInfoGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 10,
  },
  infoBox: {
    background: "#fff",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: 10,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: "#667085",
    fontWeight: 800,
    textTransform: "uppercase",
  },
  infoValue: {
    color: "#27364a",
    fontSize: 14,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    margin: "0 0 10px",
    fontSize: 15,
    color: "#27364a",
  },
  otherList: {
    display: "grid",
    gap: 8,
  },
  otherItem: {
    display: "flex",
    justifyContent: "space-between",
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    borderRadius: 10,
    padding: 12,
  },
  noOther: {
    color: "#667085",
    margin: 0,
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 16,
  },
  addBtn: {
    border: "none",
    background: "#ff6b00",
    color: "#fff",
    borderRadius: 8,
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 800,
  },
  editBtn: {
    border: "none",
    background: "#2563eb",
    color: "#fff",
    borderRadius: 8,
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 800,
  },
  deleteBtn: {
    border: "none",
    background: "#dc2626",
    color: "#fff",
    borderRadius: 8,
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 800,
  },
  emptyBox: {
    background: "#fff",
    border: "1px dashed #ddd",
    borderRadius: 12,
    padding: 24,
    color: "#777",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modal: {
    width: "100%",
    maxWidth: 680,
    maxHeight: "86vh",
    overflowY: "auto",
    background: "#fff",
    borderRadius: 16,
    padding: 22,
  },
  modalTitle: {
    marginTop: 0,
    marginBottom: 14,
    color: "#27364a",
  },
  label: {
    display: "block",
    fontWeight: 800,
    marginBottom: 8,
    marginTop: 14,
  },
  meterFormBox: {
    marginBottom: 4,
  },
  meterFormGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 8,
  },
  meterInput: {
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: "9px 10px",
    fontSize: 14,
    boxSizing: "border-box",
  },
  otherFormList: {
    display: "grid",
    gap: 8,
  },
  otherFormRow: {
    display: "grid",
    gridTemplateColumns: "1fr 160px 36px",
    gap: 8,
    alignItems: "center",
  },
  otherNameInput: {
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: "9px 10px",
    fontSize: 14,
  },
  otherAmountInput: {
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: "9px 10px",
    fontSize: 14,
  },
  removeRowBtn: {
    border: "none",
    background: "#fee2e2",
    color: "#b91c1c",
    borderRadius: 8,
    height: 38,
    cursor: "pointer",
    fontWeight: 800,
  },
  addRowBtn: {
    border: "1px solid #ff6b00",
    background: "#fff7ed",
    color: "#ff6b00",
    borderRadius: 8,
    padding: "9px 14px",
    cursor: "pointer",
    fontWeight: 800,
    marginTop: 10,
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
    marginTop: 18,
  },
  cancelBtn: {
    border: "1px solid #ddd",
    background: "#fff",
    borderRadius: 8,
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 800,
  },
  saveBtn: {
    border: "none",
    background: "#ff6b00",
    color: "#fff",
    borderRadius: 8,
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 800,
  },
};
