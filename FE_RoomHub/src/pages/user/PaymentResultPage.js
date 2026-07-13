import { Link, useSearchParams } from "react-router-dom";
import Header from "../layout/homepage/header";
import Footer from "../layout/homepage/footer";

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();

  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const provider = searchParams.get("provider");
  const message = searchParams.get("message");

  const isSuccess = status === "success";

  return (
    <>
      <Header />

      <div style={styles.page}>
        <div style={styles.card}>
          <div
            style={{
              ...styles.icon,
              background: isSuccess ? "#dcfce7" : "#fee2e2",
              color: isSuccess ? "#15803d" : "#b91c1c",
            }}
          >
            {isSuccess ? "✓" : "!"}
          </div>

          <h1>{isSuccess ? "Payment Successful" : "Payment Failed"}</h1>

          <p style={styles.message}>
            {message ||
              (isSuccess
                ? "Your payment has been confirmed."
                : "Your payment was not completed.")}
          </p>

          <p>
            Provider: <b>{provider || "N/A"}</b>
          </p>

          <p>
            Type: <b>{type || "N/A"}</b>
          </p>

          <div style={styles.actions}>
            <Link
              to={type === "rent" ? "/my-payment-bills" : "/my-deposits"}
              style={styles.primaryBtn}
            >
              View Status
            </Link>

            <Link to="/" style={styles.secondaryBtn}>
              Back Home
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

const styles = {
  page: {
    minHeight: "70vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    background: "#f8fafc",
  },
  card: {
    width: "100%",
    maxWidth: 520,
    background: "#fff",
    borderRadius: 20,
    padding: 36,
    textAlign: "center",
    boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    margin: "0 auto 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 38,
    fontWeight: 800,
  },
  message: {
    color: "#64748b",
  },
  actions: {
    display: "flex",
    justifyContent: "center",
    gap: 12,
    marginTop: 24,
  },
  primaryBtn: {
    background: "#2563eb",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: 10,
    textDecoration: "none",
  },
  secondaryBtn: {
    background: "#e2e8f0",
    color: "#0f172a",
    padding: "10px 16px",
    borderRadius: 10,
    textDecoration: "none",
  },
};