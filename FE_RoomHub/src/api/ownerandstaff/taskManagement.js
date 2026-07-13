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

export const getManagedTasks = async (filters = {}) => {
  const query = buildQuery(filters);
  const res = await fetch(`${API_URL}${getRolePrefix()}/tasks?${query}`, {
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
};
