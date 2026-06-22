import API_URL, { authHeaders, parseJsonResponse } from "./config";

// ==========================
// GET ROOM TYPES BY BOARDING HOUSE
// ==========================
export const getRoomTypesByBoardingHouse = async (boardingHouseId) => {
  const res = await fetch(
    `${API_URL}/boardinghouse/room-types/${boardingHouseId}?limit=100`,
    {
      headers: authHeaders(),
    }
  );

  return parseJsonResponse(res);
};

// ==========================
// GET ROOMS BY ROOM TYPE
// ==========================
export const getRoomsByRoomType = async (roomTypeId) => {
  const res = await fetch(
    `${API_URL}/room-types/${roomTypeId}/rooms`,
    {
      headers: authHeaders(),
    }
  );

  return parseJsonResponse(res);
};

// ==========================
// GET ROOM DETAIL
// ==========================
export const getRoomDetails = async (roomId) => {
  const res = await fetch(
    `${API_URL}/rooms/${roomId}`,
    {
      headers: authHeaders(),
    }
  );

  return parseJsonResponse(res);
};

// ==========================
// GET ROOMS BY BOARDING HOUSE
// ==========================
export const getRoomsByBoardingHouse = async (boardingHouseId) => {
  const res = await fetch(
    `${API_URL}/boardinghouse/${boardingHouseId}/rooms`,
    {
      headers: authHeaders(),
    }
  );

  return parseJsonResponse(res);
};
