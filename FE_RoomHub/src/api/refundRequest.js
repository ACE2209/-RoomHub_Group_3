import API_URL, { authHeaders, parseJsonResponse } from "./config";

const getRolePrefix = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = String(user?.role || "").toLowerCase();

  if (role === "staff") return "staff";
  return "owner";
};

export const getManagedRefundRequests = async (status = "all") => {
  const prefix = getRolePrefix();

  const res = await fetch(
    `${API_URL}/${prefix}/refund-requests?status=${status}`,
    {
      headers: authHeaders(),
    }
  );

  return parseJsonResponse(res);
};

export const rejectRefundRequest = async (refundRequestId, reasonForCancel) => {
  const prefix = getRolePrefix();

  const res = await fetch(
    `${API_URL}/${prefix}/refund-requests/${refundRequestId}/reject`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify({ reasonForCancel }),
    }
  );

  return parseJsonResponse(res);
};

export const payRefundRequest = async (
  refundRequestId,
  paymentMethod,
  damageAssessment = []
) => {
  const prefix = getRolePrefix();

  const res = await fetch(
    `${API_URL}/${prefix}/refund-requests/${refundRequestId}/pay`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify({
        paymentMethod,
        damageAssessment,
      }),
    }
  );

  return parseJsonResponse(res);
};