
import API_URL, {
  authHeaders,
  parseJsonResponse,
} from "./config";

// ========================================
// COMMON UTILS
// ========================================

const buildQuery = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ""
    ) {
      query.append(key, value);
    }
  });

  return query.toString();
};

// ========================================
// GUEST APIs
// ========================================

// View all boarding houses
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

// View newest boarding houses
export const getNewestBH = async () => {
  const res = await fetch(
    `${API_URL}/boardinghouse/newest`
  );

  return parseJsonResponse(res);
};

// View high rating boarding houses
export const getHighRatingBH = async () => {
  const res = await fetch(
    `${API_URL}/boardinghouse/highrating`
  );

  return parseJsonResponse(res);
};

// View boarding house detail
export const getBoardingHouseDetail = async (id) => {
  const res = await fetch(
    `${API_URL}/boardinghouse/${id}`
  );

  return parseJsonResponse(res);
};

// View room types by boarding house
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
// DASHBOARD APIs
// ========================================

// Get all boarding houses
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

// Filter boarding houses
export const filterBoardingHouses = async (
  filters = {}
) => {
  const query = buildQuery(filters);

  const res = await fetch(
    `${API_URL}/dashboard/boardinghouses/filter?${query}`,
    {
      headers: authHeaders(),
    }
  );

  return parseJsonResponse(res);
};

// Delete boarding house
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

