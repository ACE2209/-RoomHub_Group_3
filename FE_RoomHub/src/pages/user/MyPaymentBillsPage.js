import { useEffect, useState } from "react";
import { getMyPaymentBills, payRentBill } from "../../api/payment";
import Header from "../layout/homepage/header";
import Footer from "../layout/homepage/footer";

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export default function MyPaymentBillsPage() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState("");

  const loadBills = async () => {
    try {
      setLoading(true);
      const res = await getMyPaymentBills();
      setBills(res?.data || []);
    } catch (error) {
      alert(error.message || "Load payment bills failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBills();
  }, []);

  const handlePay = async (billId, method) => {
    try {
      setPaying(`${billId}-${method}`);

      const res = await payRentBill(billId, method);
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
        <h1>My Monthly Rent Bills</h1>

        {loading ? (
          <p>Loading...</p>
        ) : bills.length === 0 ? (
          <div style={styles.empty}>No payment bills found.</div>
        ) : (
          <div style={styles.list}>
            {bills.map((bill) => {
              const status = String(bill.status || "").toLowerCase();
              const canPay = !["paid", "done"].includes(status);

              return (
                <div key={bill._id} style={styles.card}>
                  <h3>Room {bill.roomId?.roomNumber || "N/A"}</h3>

                  <p>
                    Boarding house:{" "}
                    <b>{bill.roomId?.boardingHouseId?.name || "N/A"}</b>
                  </p>

                  <p>
                    Amount:{" "}
                    <b>{formatCurrency(bill.paymentAmount || bill.amount)}</b>
                  </p>

                  <p>
                    Status:{" "}
                    <b style={{ color: canPay ? "#ff6b00" : "green" }}>
                      {bill.status}
                    </b>
                  </p>

                  {canPay && (
                    <div style={styles.actions}>
                      <button
                        onClick={() => handlePay(bill._id, "ZaloPay")}
                        disabled={paying === `${bill._id}-ZaloPay`}
                        style={styles.zaloBtn}
                      >
                        Pay with ZaloPay
                      </button>

                      <button
                        onClick={() => handlePay(bill._id, "VNPay")}
                        disabled={paying === `${bill._id}-VNPay`}
                        style={styles.vnpayBtn}
                      >
                        Pay with VNPay
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </>
  );
}

const styles = {
  page: {
    maxWidth: 1100,
    margin: "32px auto",
    padding: "0 24px",
  },
  list: {
    display: "grid",
    gap: 16,
  },
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: 22,
    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  },
  empty: {
    background: "#fff",
    padding: 32,
    borderRadius: 16,
    textAlign: "center",
  },
  actions: {
    display: "flex",
    gap: 12,
    marginTop: 16,
  },
  zaloBtn: {
    background: "#0ea5e9",
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: 10,
    cursor: "pointer",
  },
  vnpayBtn: {
    background: "#dc2626",
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: 10,
    cursor: "pointer",
  },
};