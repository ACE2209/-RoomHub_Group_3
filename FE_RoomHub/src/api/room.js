import API_URL, { authHeaders, parseJsonResponse } from "./config";

export const getRoomDetails = async (roomId) => {
  const res = await fetch(`${API_URL}/rooms/${roomId}`, {
    headers: authHeaders(),
  });

  return parseJsonResponse(res);
};