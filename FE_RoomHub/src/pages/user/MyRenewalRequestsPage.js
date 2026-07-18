import { useEffect, useState } from "react";
import { getMyRenewalRequests } from "../../api/renewalRequestAPI";
import { getProfileAPI } from "../../api/accountAPI";
import Header from "../layout/homepage/header";
import Footer from "../layout/homepage/footer";
import ProfileSidebar from "../profile/ProfileSidebar";

const formatDate = (value) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString("vi-VN");
};

export default function MyRenewalRequestsPage() {
  const [user, setUser] = useState(null);
  const [renewalRequests, setRenewalRequests] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const loadRenewalRequests = async () => {
    try {
      setLoading(true);

      const profileRes = await getProfileAPI();
      const renewalRes = await getMyRenewalRequests({ status, limit: 100 });

      setUser(profileRes?.data || profileRes || null);
      setRenewalRequests(renewalRes?.data || []);
    } catch (error) {
      alert(error.message || "Load renewal requests failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRenewalRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <>
      <Header />

      <div style={styles.page}>
        <ProfileSidebar user={user} />

        <main style={styles.content}>
          <div style={styles.headerRow}>
            <div>
              <h1 style={styles.title}>My Renewal Requests</h1>
              <p style={styles.subtitle}>
                View all rental renewal requests you submitted.
              </p>
            </div>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={styles.filter}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {loading ? (
            <p>Loading...</p>
          ) : renewalRequests.length === 0 ? (
            <div style={styles.emptyBox}>No renewal request found.</div>
          ) : (
            <div style={styles.list}>
              {renewalRequests.map((item) => {
                const itemStatus = String(item.status || "").toLowerCase();

                return (
                  <div key={item._id} style={styles.card}>
                    <div style={styles.cardHeader}>
                      <div>
                        <h3 style={styles.roomTitle}>
                          Room {item.roomId?.roomNumber || "N/A"}
                        </h3>
                        <p>
                          Boarding house:{" "}
                          <b>{item.roomId?.boardingHouseId?.name || "N/A"}</b>
                        </p>
                      </div>

                      <span style={getStatusStyle(itemStatus)}>
                        {item.status}
                      </span>
                    </div>

                    <div style={styles.dateGrid}>
                      <Info
                        label="Current end date"
                        value={formatDate(item.currentEndDate)}
                      />
                      <Info
                        label="Requested end date"
                        value={formatDate(item.requestedEndDate)}
                      />
                      <Info
                        label="Created at"
                        value={formatDate(item.createdAt)}
                      />
                    </div>

                    {item.tenantNote && (
                      <div style={styles.section}>
                        <h4 style={styles.sectionTitle}>Your Note</h4>
                        <pre style={styles.noteBox}>{item.tenantNote}</pre>
                      </div>
                    )}

                    {itemStatus === "rejected" && item.reasonForCancel && (
                      <div style={styles.section}>
                        <h4 style={styles.sectionTitle}>Reject Reason</h4>
                        <div style={styles.rejectBox}>
                          {item.reasonForCancel}
                        </div>
                      </div>
                    )}

                    {itemStatus === "accepted" && (
                      <p style={styles.success}>
                        Your rental has been extended to{" "}
                        {formatDate(item.requestedEndDate)}.
                      </p>
                    )}
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

const getStatusStyle = (status) => ({
  ...styles.statusBadge,
  background:
    status === "pending"
      ? "#fff7ed"
      : status === "accepted"
      ? "#dcfce7"
      : "#fee2e2",
  color:
    status === "pending"
      ? "#c2410c"
      : status === "accepted"
      ? "#15803d"
      : "#b91c1c",
});

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
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
  },
  title: { margin: 0, fontSize: 28 },
  subtitle: { marginTop: 8, color: "#666" },
  filter: {
    height: 42,
    borderRadius: 8,
    border: "1px solid #d0d5dd",
    padding: "0 12px",
    color: "#344054",
    background: "#fff",
  },
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
  dateGrid: {
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
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  section: { marginTop: 18 },
  sectionTitle: { margin: "0 0 8px", fontSize: 16 },
  noteBox: {
    whiteSpace: "pre-wrap",
    fontFamily: "inherit",
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: 10,
    padding: 14,
    lineHeight: 1.6,
    margin: 0,
  },
  rejectBox: {
    background: "#fee2e2",
    color: "#b91c1c",
    border: "1px solid #fecaca",
    borderRadius: 10,
    padding: 14,
    fontWeight: 600,
  },
  success: { color: "green", fontWeight: 600, marginTop: 12 },
  emptyBox: {
    marginTop: 24,
    padding: 24,
    border: "1px dashed #ddd",
    borderRadius: 12,
    color: "#777",
  },
};
