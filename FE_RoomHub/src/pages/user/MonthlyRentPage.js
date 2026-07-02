import { useEffect, useState } from "react";
import { getMyPaymentBills, payRentBill } from "../../api/payment";

const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export default function MonthlyRentPage() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState("");

  const loadBills = async () => {
    try {
      setLoading(true);
      const res = await getMyPaymentBills();
      setBills(res?.data || []);
    } catch (error) {
      alert(error.message || "Load bills failed");
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
    <div style={{ padding: 32, maxWidth: 1100, margin: "0 auto" }}>
      <h1>Monthly Rent</h1>

      {loading ? (
        <p>Loading...</p>
      ) : bills.length === 0 ? (
        <p>No payment bill found.</p>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {bills.map((bill) => {
            const status = String(bill.status || "").toLowerCase();
            const canPay = status === "pending";

            return (
              <div
                key={bill._id}
                style={{
                  background: "#fff",
                  border: "1px solid #eee",
                  borderRadius: 12,
                  padding: 20,
                }}
              >
                <h3>Room {bill.roomId?.roomNumber || "N/A"}</h3>
                <p>Boarding house: {bill.roomId?.boardingHouseId?.name}</p>
                <p>Month: {bill.month}/{bill.year}</p>
                <p>Amount: <b>{formatCurrency(bill.paymentAmount)}</b></p>
                <p>Status: <b>{bill.status}</b></p>

                {canPay && (
                  <div style={{ display: "flex", gap: 12 }}>
                    <button
                      onClick={() => handlePay(bill._id, "MoMo")}
                      disabled={paying === `${bill._id}-MoMo`}
                    >
                      Pay with MoMo
                    </button>

                    <button
                      onClick={() => handlePay(bill._id, "VNPay")}
                      disabled={paying === `${bill._id}-VNPay`}
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
  );
}
