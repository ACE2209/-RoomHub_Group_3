import API_URL, { authHeaders, parseJsonResponse } from "./config";

const buildQuery = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, value);
    }
  });

  return query.toString();
};

export const getBoardingHouses = async ({ page = 1, limit = 10 } = {}) => {
  const query = buildQuery({ page, limit });
  const res = await fetch(`${API_URL}/dashboard/boardinghouses?${query}`, {
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
};

// xem chi tiết nhà trọ 
export const getBoardingHouseDetail = async (id) => {
  const res = await fetch(`${API_URL}/boardinghouse/${id}`);

  return parseJsonResponse(res);
};

export const filterBoardingHouses = async (filters = {}) => {
  const query = buildQuery(filters);
  const res = await fetch(`${API_URL}/dashboard/boardinghouses/filter?${query}`, {
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
};

export const deleteBoardingHouse = async (id) => {
  const res = await fetch(`${API_URL}/dashboard/boardinghouses/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
};

export const getBoardingHouseTypes = async () => {
  const res = await fetch(`${API_URL}/staff/types`, {
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
};

export const getOwnBoardingHouses = async ({ page = 1, limit = 10 } = {}) => {
  const query = buildQuery({ page, limit });
  const res = await fetch(`${API_URL}/staff/boardinghouses?${query}`, {
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
};

export const getOwnBoardingHouseDetail = async (id) => {
  const res = await fetch(`${API_URL}/staff/boardinghouses/${id}`, {
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
};

export const createOwnBoardingHouse = async (data) => {
  const res = await fetch(`${API_URL}/staff/boardinghouses`, {
    method: "POST",
    headers: authHeaders(),
    body: data,
  });

  return parseJsonResponse(res);
};

export const updateOwnBoardingHouse = async (id, data) => {
  const res = await fetch(`${API_URL}/staff/boardinghouses/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: data,
  });

  return parseJsonResponse(res);
};

export const deleteOwnBoardingHouse = async (id) => {
  const res = await fetch(`${API_URL}/staff/boardinghouses/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
};

export const getBoardingHouseReviews = async (id) => {
  const res = await fetch(`${API_URL}/boardinghouse/${id}/reviews`);

  return parseJsonResponse(res);
};
