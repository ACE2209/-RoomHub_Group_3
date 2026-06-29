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

const getRolePrefix = () => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = user?.role || localStorage.getItem("role");

  if (role === "owner") return "/owner";
  if (role === "staff") return "/staff";

  return "/owner";
};

export const getBoardingHouses = async ({ page = 1, limit = 10 } = {}) => {
  const query = buildQuery({ page, limit });
  const res = await fetch(`${API_URL}/dashboard/boardinghouses?${query}`, {
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
};

export const getAllBoardingHousesForGuest = async ({ page = 1, limit = 10 } = {}) => {
  const query = buildQuery({ page, limit });
  const res = await fetch(`${API_URL}/boardinghouse?${query}`);

  return parseJsonResponse(res);
};

export const getNewestBH = async () => {
  const res = await fetch(`${API_URL}/boardinghouse/newest`);

  return parseJsonResponse(res);
};

export const getHighRatingBH = async () => {
  const res = await fetch(`${API_URL}/boardinghouse/highrating`);

  return parseJsonResponse(res);
};

// xem chi tiết nhà trọ 
export const getBoardingHouseDetail = async (id) => {
  const res = await fetch(`${API_URL}/boardinghouse/${id}`);

  return parseJsonResponse(res);
};

export const getRoomTypesByBoardingHouseForGuest = async (
  boardingHouseId,
  { page = 1, limit = 100 } = {}
) => {
  const query = buildQuery({ page, limit });
  const res = await fetch(`${API_URL}/boardinghouse/room-types/${boardingHouseId}?${query}`);

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
  const res = await fetch(`${API_URL}${getRolePrefix()}/types`, {
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
};

export const getOwnBoardingHouses = async ({ page = 1, limit = 10 } = {}) => {
  const query = buildQuery({ page, limit });
  const res = await fetch(`${API_URL}${getRolePrefix()}/boardinghouses?${query}`, {
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
};

export const getOwnBoardingHouseDetail = async (id) => {
  const res = await fetch(`${API_URL}${getRolePrefix()}/boardinghouses/${id}`, {
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
};

export const createOwnBoardingHouse = async (data) => {
  const res = await fetch(`${API_URL}${getRolePrefix()}/boardinghouses`, {
    method: "POST",
    headers: authHeaders(),
    body: data,
  });

  return parseJsonResponse(res);
};

export const updateOwnBoardingHouse = async (id, data) => {
  const res = await fetch(`${API_URL}${getRolePrefix()}/boardinghouses/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: data,
  });

  return parseJsonResponse(res);
};

export const deleteOwnBoardingHouse = async (id) => {
  const res = await fetch(`${API_URL}${getRolePrefix()}/boardinghouses/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
};

export const getBoardingHouseReviews = async (id) => {
  const res = await fetch(`${API_URL}/boardinghouse/${id}/reviews`);

  return parseJsonResponse(res);
};
