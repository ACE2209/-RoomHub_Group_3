import API_URL, { authHeaders, parseJsonResponse, } from "./config";

export const getWatchLater = async () => {
    const res = await fetch(
        `${API_URL}/auth/watchlater`,
        {
            headers: authHeaders(),
        }
    );

    return parseJsonResponse(res);
};

export const toggleWatchLater = async (boardingHouseId) => {
    const res = await fetch(`${API_URL}/auth/watchlater`, {
        method: "POST",
        headers: {
            ...authHeaders(),
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ boardingHouseId }),
    });

    return parseJsonResponse(res);
};
