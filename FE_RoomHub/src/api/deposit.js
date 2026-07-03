import API_URL, { authHeaders, parseJsonResponse } from "./config";

export const createDepositRequest = async (data) => {
  const res = await fetch(`${API_URL}/auth/deposits`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(data),
  });

  return parseJsonResponse(res);
};

export const getMyDeposits = async () => {
  const res = await fetch(`${API_URL}/auth/deposits`, {
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
};

export const payDeposit = async (depositId, method) => {
  const res = await fetch(`${API_URL}/auth/deposits/${depositId}/pay`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ method }),
  });

  return parseJsonResponse(res);
};