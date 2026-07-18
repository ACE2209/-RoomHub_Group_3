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

const jsonHeaders = () => ({
  "Content-Type": "application/json",
  ...authHeaders(),
});

export const getOwnerStaffs = async ({ page = 1, limit = 10, search = "" } = {}) => {
  const query = buildQuery({ page, limit, search });
  const res = await fetch(`${API_URL}/owner/staffs?${query}`, {
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
};

export const createOwnerStaff = async (payload) => {
  const res = await fetch(`${API_URL}/owner/staffs`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });

  return parseJsonResponse(res);
};

export const updateOwnerStaff = async (staffId, payload) => {
  const res = await fetch(`${API_URL}/owner/staffs/${staffId}`, {
    method: "PUT",
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });

  return parseJsonResponse(res);
};

export const resendOwnerStaffInvitation = async (staffId) => {
  const res = await fetch(`${API_URL}/owner/staffs/${staffId}/invitation`, {
    method: "POST",
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
};

export const deleteOwnerStaff = async (staffId) => {
  const res = await fetch(`${API_URL}/owner/staffs/${staffId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
};
