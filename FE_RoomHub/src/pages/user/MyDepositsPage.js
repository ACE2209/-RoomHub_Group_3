import { useEffect, useState } from "react";
import { getMyDeposits, payDeposit } from "../../api/deposit";
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

const formatDate = (value) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleDateString("vi-VN");
};

export default function MyDepositsPage() {
  const [user, setUser] = useState(null);
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState("");

  const loadDeposits = async () => {
    try {
      setLoading(true);

      const profileRes = await getProfileAPI();
      const depositRes = await getMyDeposits();

      setUser(profileRes?.data || profileRes || null);
      setDeposits(depositRes?.data || []);
    } catch (error) {
      alert(error.message || "Load deposits failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeposits();
  }, []);

  const handlePay = async (depositId, method) => {
    try {
      setPaying(`${depositId}-${method}`);

      const res = await payDeposit(depositId, method);
      const paymentUrl = res?.data?.paymentUrl || res?.data?.payUrl;

      if (!paymentUrl) {
        alert("Payment URL not found");
        return;
      }

      window.location.href = paymentUrl;
    } catch (error) {
      alert(error.message || "Payment failed");
    } finally {
      setPaying("");
    }
  };

  return (
    <>
      <Header />

      <div style={styles.page}>
        <ProfileSidebar user={user} />

        <main style={styles.content}>
          <h1 style={styles.title}>My Deposits</h1>
          <p style={styles.subtitle}>
            Deposit requests must be accepted by owner/staff before payment.
          </p>

          {loading ? (
            <p>Loading...</p>
          ) : deposits.length === 0 ? (
            <div style={styles.emptyBox}>
              <p>No deposit request found.</p>
            </div>
          ) : (
            <div style={styles.list}>
              {deposits.map((deposit) => {
                const room = deposit.roomId;
                const status = String(deposit.status || "").toLowerCase();

                const canPay = status === "accepted";
                const isPaid = status === "confirmed";
                const isPending = status === "pending";
                const isRejected = status === "rejected";

                return (
                  <div key={deposit._id} style={styles.card}>
                    <div>
                      <h3 style={styles.roomTitle}>
                        Room {room?.roomNumber || "N/A"}
                      </h3>

                      <p>
                        Boarding house:{" "}
                        <b>{room?.boardingHouseId?.name || "N/A"}</b>
                      </p>

                      <p>
                        Room type:{" "}
                        <b>{room?.roomTypeId?.typeName || "N/A"}</b>
                      </p>

                      <p>
                        Monthly price:{" "}
                        <b>{formatCurrency(room?.roomTypeId?.price)}</b>
                      </p>

                      <p>
  Deposit months: <b>{deposit.depositMonths || 1} month(s)</b>
</p>

                    <p>
  Deposit amount: <b>{formatCurrency(deposit.amount)}</b>
</p>

                      <p>
                        Rental time: <b>{deposit.rentalTime || 6} months</b>
                      </p>

                      <p>
                        Start date: <b>{formatDate(deposit.startDate)}</b>
                      </p>

                      <p>
                        End date: <b>{formatDate(deposit.endDate)}</b>
                      </p>
                      <p>
                        Status:{" "}
                        <b
                          style={{
                            color: canPay
                              ? "#ff6b00"
                              : isPaid
                              ? "green"
                              : isRejected
                              ? "red"
                              : "#666",
                          }}
                        >
                          {deposit.status}
                        </b>
                      </p>
                    </div>

                    {isPending && (
                      <p style={styles.note}>
                        Waiting for owner/staff approval.
                      </p>
                    )}

                    {isRejected && (
                      <p style={styles.reject}>
                        Your deposit request was rejected.
                      </p>
                    )}

                    {isPaid && (
                      <p style={styles.success}>
                        Deposit paid successfully.
                      </p>
                    )}

                    {canPay && (
                      <div style={styles.actions}>
                        <button
                          type="button"
                          onClick={() => handlePay(deposit._id, "MoMo")}
                          disabled={paying === `${deposit._id}-MoMo`}
                          style={styles.momoBtn}
                        >
                          {paying === `${deposit._id}-MoMo`
                            ? "Processing..."
                            : "Pay with MoMo"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handlePay(deposit._id, "VNPay")}
                          disabled={paying === `${deposit._id}-VNPay`}
                          style={styles.vnpayBtn}
                        >
                          {paying === `${deposit._id}-VNPay`
                            ? "Processing..."
                            : "Pay with VNPay"}
                        </button>
                      </div>
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
  title: {
    margin: 0,
    fontSize: 28,
  },
  subtitle: {
    marginTop: 8,
    color: "#666",
  },
  list: {
    display: "grid",
    gap: 16,
    marginTop: 24,
  },
  card: {
    border: "1px solid #eee",
    borderRadius: 14,
    padding: 20,
    background: "#fff",
  },
  roomTitle: {
    marginTop: 0,
  },
  note: {
    color: "#777",
    marginTop: 12,
  },
  success: {
    color: "green",
    fontWeight: 600,
    marginTop: 12,
  },
  reject: {
    color: "red",
    fontWeight: 600,
    marginTop: 12,
  },
  actions: {
    display: "flex",
    gap: 12,
    marginTop: 16,
  },
  momoBtn: {
    border: "none",
    background: "#a50064",
    color: "#fff",
    borderRadius: 8,
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 700,
  },
  vnpayBtn: {
    border: "none",
    background: "#005baa",
    color: "#fff",
    borderRadius: 8,
    padding: "10px 16px",
    cursor: "pointer",
    fontWeight: 700,
  },
  emptyBox: {
    marginTop: 24,
    padding: 24,
    border: "1px dashed #ddd",
    borderRadius: 12,
    color: "#777",
  },
};