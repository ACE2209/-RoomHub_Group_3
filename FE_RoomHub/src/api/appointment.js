import API_URL, { authHeaders, parseJsonResponse } from "./config";

export const getMyAppointments = async (page = 1, limit = 10) => {
  const res = await fetch(
    `${API_URL}/appointments/my?page=${page}&limit=${limit}`,
    {
      headers: authHeaders(),
    }
  );

  return parseJsonResponse(res);
};

export const getAppointmentDetail = async (appointmentId) => {
  const res = await fetch(`${API_URL}/appointments/${appointmentId}`, {
    method: "GET",
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