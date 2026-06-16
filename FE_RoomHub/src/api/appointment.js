import API_URL, { authHeaders, parseJsonResponse } from "./config";

export const getMyAppointments = async () => {
  const res = await fetch(`${API_URL}/appointments/my`, {
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
};

export const cancelAppointment = async (appointmentId, data = {}) => {
  const res = await fetch(`${API_URL}/appointments/${appointmentId}/cancel`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(data),
  });

  return parseJsonResponse(res);
};

export const createAppointment = async (data) => {
  const res = await fetch(`${API_URL}/appointments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(data),
  });

  return parseJsonResponse(res);
};