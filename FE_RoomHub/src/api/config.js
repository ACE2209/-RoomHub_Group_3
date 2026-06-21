const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

export default API_URL;

export const getToken = () => localStorage.getItem("token");

export const authHeaders = () => {
  const token = getToken();

  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const parseJsonResponse = async (res) => {
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = data?.message || data?.error || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data;
};
