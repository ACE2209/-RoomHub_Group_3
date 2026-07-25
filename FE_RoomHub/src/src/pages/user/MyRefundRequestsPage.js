import { useEffect, useState } from "react";
import { getMyRefundRequests } from "../../api/deposit";
import { getProfileAPI } from "../../api/accountAPI";
import Header from "../layout/homepage/header";
import Footer from "../layout/homepage/footer";
import ProfileSidebar from "../profile/ProfileSidebar";

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
const getLocationName = (value) => {
  if (!value) return "";

  if (typeof value === "string") return value;

  if (typeof value === "object") {
    return (
      value.name ||
      value.fullName ||
      value.full_name ||
      value.label ||
      value.title ||
      ""
    );
  }

  return String(value);
};

const formatAddress = (address) => {
  if (!address) return "N/A";

  if (typeof address === "string") return address;

  if (typeof address === "object") {
    return [
      getLocationName(address.detail),
      getLocationName(address.ward),
      getLocationName(address.district),
      getLocationName(address.province),
    ]
      .filter(Boolean)
      .join(", ") || "N/A";
  }

  return String(address);
};
export default function MyRefundRequestsPage() {
  const [user, setUser] = useState(null);
  const [refundRequests, setRefundRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadRefundRequests = async () => {
    try {
      setLoading(true);

      const profileRes = await getProfileAPI();
      const refundRes = await getMyRefundRequests();

      setUser(profileRes?.data || profileRes || null);
      setRefundRequests(refundRes?.data || []);
    } catch (error) {
      alert(error.message || "Load refund requests failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRefundRequests();
  }, []);

  return (
    <>
      <Header />

      <div style={styles.page}>
        <ProfileSidebar user={user} />

        <main style={styles.content}>
          <h1 style={styles.title}>My Refund Requests</h1>
          <p style={styles.subtitle}>
            View all deposit refund requests you submitted.
          </p>

          {loading ? (
            <p>Loading...</p>
          ) : refundRequests.length === 0 ? (
            <div style={styles.emptyBox}>No refund request found.</div>
          ) : (
            <div style={styles.list}>
              {refundRequests.map((item) => {
                const status = String(item.status || "").toLowerCase();

                return (
                  <div key={item._id} style={styles.card}>
                    <div style={styles.cardHeader}>
                      <div>
                        <h3 style={styles.roomTitle}>
                          Room {item.room?.roomNumber || "N/A"}
                        </h3>
                        <p>
                          Boarding house:{" "}
                          <b>{item.boardingHouse?.name || "N/A"}</b>
                        </p>
                        <p>
                          Address:{" "}
                          <b>{formatAddress(item.boardingHouse?.address)}</b>
                        </p>
                      </div>

                      <span
                        style={{
                          ...styles.statusBadge,
                          background:
                            status === "pending"
                              ? "#fff7ed"
                              : status === "accepted"
                              ? "#dcfce7"
                              : status === "rejected"
                              ? "#fee2e2"
                              : "#e0f2fe",
                          color:
                            status === "pending"
                              ? "#c2410c"
                              : status === "accepted"
                              ? "#15803d"
                              : status === "rejected"
                              ? "#b91c1c"
                              : "#0369a1",
                        }}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div style={styles.moneyGrid}>
                      <Info
                        label="Original deposit"
                        value={formatCurrency(item.originalDepositAmount)}
                      />
                      <Info
                        label="Damage cost"
                        value={formatCurrency(item.totalDamageAmount)}
                      />
                      <Info
                        label="Actual refund"
                        value={formatCurrency(item.actualRefundAmount)}
                      />
                    </div>

                    <div style={styles.section}>
                      <h4 style={styles.sectionTitle}>Refund Reason</h4>
                      <pre style={styles.reasonBox}>{item.reason || "N/A"}</pre>
                    </div>

                    {item.damageAssessment?.length > 0 && (
                      <div style={styles.section}>
                        <h4 style={styles.sectionTitle}>Damage Assessment</h4>

                        <div style={styles.damageList}>
                          {item.damageAssessment.map((damage, index) => (
                            <div key={index} style={styles.damageItem}>
                              <span>{damage.damageName || "N/A"}</span>
                              <b>{formatCurrency(damage.estimatedCost)}</b>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {item.reasonForCancel && (
                      <div style={styles.section}>
                        <h4 style={styles.sectionTitle}>Reject Reason</h4>
                        <div style={styles.rejectBox}>
                          {item.reasonForCancel}
                        </div>
                      </div>
                    )}

                    <div style={styles.meta}>
                      <span>Created at: {item.createdAt || "N/A"}</span>
                      <span>Processed at: {item.processedAt || "N/A"}</span>
                      <span>
                        Processed by:{" "}
                        {item.processedBy?.fullname ||
                          item.processedBy?.email ||
                          "Not processed yet"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      <Footer />
    </>
  );
}

function Info({ label, value }) {
  return (
    <div style={styles.infoBox}>
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    gap: 24,
    maxWidth: 1200,
    margin: "32px auto",
    padding: "0 24px",
    alignItems: "flex-start",
  },
  content: {
    flex: 1,
    background: "#fff",
    borderRadius: 16,
    padding: 28,
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
  },
  title: { margin: 0, fontSize: 28 },
  subtitle: { marginTop: 8, color: "#666" },
  list: { display: "grid", gap: 16, marginTop: 24 },
  card: {
    border: "1px solid #eee",
    borderRadius: 14,
    padding: 20,
    background: "#fff",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
  },
  roomTitle: { marginTop: 0 },
  statusBadge: {
    padding: "8px 12px",
    borderRadius: 999,
    fontWeight: 700,
    textTransform: "capitalize",
  },
  moneyGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
    marginTop: 16,
  },
  infoBox: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: 12,
  },
  section: { marginTop: 18 },
  sectionTitle: { margin: "0 0 8px", fontSize: 16 },
  reasonBox: {
    whiteSpace: "pre-wrap",
    fontFamily: "inherit",
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: 14,
    lineHeight: 1.6,
  },
  rejectBox: {
    background: "#fee2e2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: 10,
    padding: 14,
    fontWeight: 600,
  },
  damageList: {
    display: "grid",
    gap: 8,
  },
  damageItem: {
    display: "flex",
    justifyContent: "space-between",
    background: "#fff7ed",
    border: "1px solid #fed7aa",
    borderRadius: 10,
    padding: 12,
  },
  meta: {
    display: "grid",
    gap: 6,
    marginTop: 18,
    color: "#666",
    fontSize: 14,
  },
  emptyBox: {
    marginTop: 24,
    padding: 24,
    border: "1px dashed #ddd",
    borderRadius: 12,
    color: "#777",
  },
};