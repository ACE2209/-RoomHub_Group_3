import API_URL, { authHeaders, parseJsonResponse, } from "./config";

export const getFavorites = async () => {
    const res = await fetch(
        `${API_URL}/auth/favorites`,
        {
            headers: authHeaders(),
        }
    );

    return parseJsonResponse(res);
};

export const toggleFavorite = async (boardingHouseId) => {
    const res = await fetch(`${API_URL}/auth/favorites`, {
        method: "POST",
        headers: {
            ...authHeaders(),
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ boardingHouseId }),
    });

    return parseJsonResponse(res);
};