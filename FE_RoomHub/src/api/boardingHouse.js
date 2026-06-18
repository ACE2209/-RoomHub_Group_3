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

// ========================================
// GUEST - VIEW ALL BOARDING HOUSES
// ========================================

export const getAllBoardingHousesForGuest = async ({
  page = 1,
  limit = 10,
} = {}) => {
  const query = buildQuery({ page, limit });

  const res = await fetch(
    `${API_URL}/boardinghouse?${query}`
  );

  return parseJsonResponse(res);
};


// ==========================
// GET NEWEST BOARDING HOUSES
// ==========================
// Mục đích: Lấy danh sách boarding house mới nhất từ server
// Backend: GET /boardinghouse/newest
// Sắp xếp: createdAt DESC (mới nhất lên đầu)

export const getNewestBH = async () => {
  const res = await fetch(`${API_URL}/boardinghouse/newest`);

  return parseJsonResponse(res);
};

// ==========================
// GET HIGH RATING BOARDING HOUSES
// ==========================
// Mục đích: Lấy danh sách boarding house có rating cao
// Backend: GET /boardinghouse/highrating
// Điều kiện: rating >= 4

export const getHighRatingBH = async () => {
  const res = await fetch(`${API_URL}/boardinghouse/highrating`);

  return parseJsonResponse(res);
};
// view detail boarding house for guest


export const getBoardingHouseDetailForGuest = async (boardingHouseId) => {
const res = await fetch(
`${API_URL}/boardinghouse/${boardingHouseId}`
);

return parseJsonResponse(res);
};

export const getRoomTypesByBoardingHouseForGuest = async (
  boardingHouseId,
  { page = 1, limit = 100 } = {}
) => {
  const query = buildQuery({ page, limit });

  const res = await fetch(
    `${API_URL}/boardinghouse/room-types/${boardingHouseId}?${query}`
  );

  return parseJsonResponse(res);
};

// ========================================
// DASHBOARD - GET ALL BOARDING HOUSES
// ========================================

export const getBoardingHouses = async ({
  page = 1,
  limit = 10,
} = {}) => {
  const query = buildQuery({ page, limit });

  const res = await fetch(
    `${API_URL}/dashboard/boardinghouses?${query}`,
    {
      headers: authHeaders(),
    }
  );

  return parseJsonResponse(res);
};

// ========================================
// DASHBOARD - FILTER BOARDING HOUSES
// ========================================

export const filterBoardingHouses = async (filters = {}) => {
  const query = buildQuery(filters);

  const res = await fetch(
    `${API_URL}/dashboard/boardinghouses/filter?${query}`,
    {
      headers: authHeaders(),
    }
  );

  return parseJsonResponse(res);
};

// ========================================
// DASHBOARD - DELETE BOARDING HOUSE
// ========================================

export const deleteBoardingHouse = async (id) => {
  const res = await fetch(
    `${API_URL}/dashboard/boardinghouses/${id}`,
    {
      method: "DELETE",
      headers: authHeaders(),
    }
  );

  return parseJsonResponse(res);
};
