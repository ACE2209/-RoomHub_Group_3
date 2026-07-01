import { Link, useSearchParams } from "react-router-dom";

export default function PaymentResultPage() {
  const [params] = useSearchParams();

  const status = params.get("status");
  const type = params.get("type");
  const provider = params.get("provider");
  const message = params.get("message");

  const success = status === "success";

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h1 style={{ color: success ? "green" : "red" }}>
        {success ? "Payment Successful" : "Payment Failed"}
      </h1>

      <p>{message}</p>
      <p>Type: <b>{type}</b></p>
      <p>Provider: <b>{provider}</b></p>

      <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
        <Link to="/my-deposits">My Deposits</Link>
        <Link to="/monthly-rent">Monthly Rent</Link>
      </div>
    </div>
  );
}