import API_URL, { authHeaders, parseJsonResponse } from "./config";

const getRolePrefix = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role || localStorage.getItem("role");

  if (role === "owner") return "/owner";
  if (role === "staff") return "/staff";

  return "/staff";
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

export const getManagedMonthlyRents = async (params = {}) => {
  const res = await fetch(
    `${API_URL}${getRolePrefix()}/monthly-rents${buildQuery(params)}`,
    {
      headers: authHeaders(),
    }
  );

  return parseJsonResponse(res);
};

export const getManagedRentPayments = async (params = {}) => {
  const res = await fetch(
    `${API_URL}${getRolePrefix()}/monthly-rent-payments${buildQuery(params)}`,
    {
      headers: authHeaders(),
    }
  );

  return parseJsonResponse(res);
};

export const getManagedMonthlyRentDetail = async (billId) => {
  const res = await fetch(`${API_URL}${getRolePrefix()}/monthly-rents/${billId}`, {
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
};

export const calculateMonthlyRent = async (roomId, data) => {
  const res = await fetch(
    `${API_URL}${getRolePrefix()}/monthly-rents/calculate/${roomId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify(data),
    }
  );

  return parseJsonResponse(res);
};

export const getMyMonthlyRents = async () => {
  const res = await fetch(`${API_URL}/monthly-rents/my`, {
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
};

export const getMyMonthlyRentDetail = async (userPaymentId) => {
  const res = await fetch(`${API_URL}/monthly-rents/my/${userPaymentId}`, {
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
};

export const payMyMonthlyRent = async (userPaymentId, data) => {
  const res = await fetch(`${API_URL}/monthly-rents/my/${userPaymentId}/pay`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(data),
  });

  return parseJsonResponse(res);
};
