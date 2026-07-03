import API_URL, { authHeaders, parseJsonResponse } from "./config";

export const getMyPaymentBills = async () => {
  const res = await fetch(`${API_URL}/auth/payment-bills`, {
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
};

export const payRentBill = async (billId, method) => {
  const res = await fetch(`${API_URL}/auth/payment-bills/${billId}/pay`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ method }),
  });

  return parseJsonResponse(res);
};