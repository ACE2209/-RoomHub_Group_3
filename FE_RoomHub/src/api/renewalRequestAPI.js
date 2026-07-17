import API_URL, { authHeaders, parseJsonResponse } from "./config";

const getRolePrefix = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = String(user?.role || "").toLowerCase();

  if (role === "staff") return "staff";
  return "owner";
};

const buildQuery = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, value);
    }
  });

  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
};

export const getMyRenewalRequests = async (params = {}) => {
  const res = await fetch(
    `${API_URL}/auth/renewal-requests${buildQuery(params)}`,
    {
      headers: authHeaders(),
    }
  );

  return parseJsonResponse(res);
};

export const createRenewalRequest = async (data) => {
  const res = await fetch(`${API_URL}/auth/renewal-requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(data),
  });

  return parseJsonResponse(res);
};

export const getManagedRenewalRequests = async (params = {}) => {
  const res = await fetch(
    `${API_URL}/${getRolePrefix()}/renewal-requests${buildQuery(params)}`,
    {
      headers: authHeaders(),
    }
  );

  return parseJsonResponse(res);
};

export const decideRenewalRequest = async (requestId, action, reasonForCancel = "") => {
  const res = await fetch(
    `${API_URL}/${getRolePrefix()}/renewal-requests/${requestId}/decision`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify({ action, reasonForCancel }),
    }
  );

  return parseJsonResponse(res);
};
