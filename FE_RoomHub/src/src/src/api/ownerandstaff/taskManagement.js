import API_URL, { authHeaders, parseJsonResponse } from "../config";

const buildQuery = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, value);
    }
  });

  return query.toString();
};

const getRolePrefix = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  return user?.role === "owner" ? "/owner" : "/staff";
};

const jsonHeaders = () => ({
  "Content-Type": "application/json",
  ...authHeaders(),
});

export const getManagedTasks = async (filters = {}) => {
  const query = buildQuery(filters);
  const res = await fetch(`${API_URL}${getRolePrefix()}/tasks?${query}`, {
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
};

export const createManagedTask = async (payload) => {
  const res = await fetch(`${API_URL}${getRolePrefix()}/tasks`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });

  return parseJsonResponse(res);
};

export const updateManagedTask = async (taskId, payload) => {
  const res = await fetch(`${API_URL}${getRolePrefix()}/tasks/${taskId}`, {
    method: "PUT",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });

  return parseJsonResponse(res);
};

export const deleteManagedTask = async (taskId) => {
  const res = await fetch(`${API_URL}${getRolePrefix()}/tasks/${taskId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
};
