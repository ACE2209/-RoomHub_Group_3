import API_URL, { authHeaders, parseJsonResponse } from "./config";

export const getRoomTypesByBoardingHouse = async (boardingHouseId) => {
  const res = await fetch(
    `${API_URL}/boardinghouse/room-types/${boardingHouseId}?limit=100`,
    {
      headers: authHeaders(),
    }
  );

  return parseJsonResponse(res);
};

export const getRoomsByRoomType = async (roomTypeId) => {
  const res = await fetch(
    `${API_URL}/room-types/${roomTypeId}/rooms`,
    {
      headers: authHeaders(),
    }
  );

  return parseJsonResponse(res);
};

export const getRoomDetails = async (roomId) => {
  const res = await fetch(
    `${API_URL}/rooms/${roomId}`,
    {
      headers: authHeaders(),
    }
  );

  return parseJsonResponse(res);
};

export const getRoomsByBoardingHouse = async (boardingHouseId, params = {}) => {
  const queryString = new URLSearchParams(params).toString();

  const url =
    `${API_URL}/staff/room/boarding-house/${boardingHouseId}${queryString ? `?${queryString}` : ""
    }`;

  console.log("boardingHouseId =", boardingHouseId);
  console.log("url =", url);

  const res = await fetch(url, {
    method: "GET",
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
};

export const getAllRooms = async (params = {}) => {
  const queryString =
    new URLSearchParams(params).toString();

  const res = await fetch(
    `${API_URL}/staff/room${queryString ? `?${queryString}` : ""
    }`,
    {
      headers: authHeaders(),
    }
  );

  return parseJsonResponse(res);
};

export const createRoom = async (formData) => {
  const res = await fetch(
    `${API_URL}/staff/room/boarding-house`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: formData,
    }
  );

  return parseJsonResponse(res);
};

export const updateRoom = async (roomId, formData) => {
  console.log("roomId =", roomId);

  for (let pair of formData.entries()) {
    console.log(pair[0], pair[1]);
  }

  const res = await fetch(
    `${API_URL}/staff/room/boarding-house/${roomId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: formData,
    }
  );

  return parseJsonResponse(res);
};

export const deleteRoom = async (roomId) => {
  const res = await fetch(
    `${API_URL}/staff/room/boarding-house/${roomId}`,
    {
      method: "DELETE",
      headers: authHeaders(),
    }
  );

  return parseJsonResponse(res);
};
