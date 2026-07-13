import API_BASE_URL, { authHeaders, parseJsonResponse } from "../config";

const getRolePrefix = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role || localStorage.getItem("role");

  if (role === "owner") return "/owner";
  if (role === "staff") return "/staff";

  return "/owner";
};

const buildQuery = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, value);
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

export const getManagedAppointments = async (params = {}) => {
  const res = await fetch(
    `${API_BASE_URL}${getRolePrefix()}/appointments${buildQuery(params)}`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );

  return parseJsonResponse(res);
};

export const getManagedAppointmentDetail = async (appointmentId) => {
  const res = await fetch(
    `${API_BASE_URL}${getRolePrefix()}/appointments/${appointmentId}`,
    {
      method: "GET",
      headers: authHeaders(),
    }
  );

  return parseJsonResponse(res);
};

export const updateManagedAppointmentStatus = async (appointmentId, data) => {
  const res = await fetch(
    `${API_BASE_URL}${getRolePrefix()}/appointments/${appointmentId}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify(data),
    }
  );

  return parseJsonResponse(res);
};
