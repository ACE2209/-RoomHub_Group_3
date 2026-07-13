import axios from "axios";

const API = axios.create({
    baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000",
});

const getAuthToken = () => localStorage.getItem("token");

API.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const handleError = (error) => {
    const message = error.response?.data?.message || error.message;
    throw new Error(message);
};

export const getRoomTypesByBoardingHouse = async (boardingHouseId, options = {}) => {
    try {
        const params = new URLSearchParams();
        if (options.page) params.append("page", options.page);
        if (options.limit) params.append("limit", options.limit);

        const response = await API.get(
            `/staff/boardinghouse/room-types/${boardingHouseId}?${params.toString()}`
        );
        return response.data;
    } catch (error) {
        handleError(error);
    }
};

export const createRoomType = async (boardingHouseId, formData) => {
    try {
        const response = await API.post(
            `/staff/boardinghouse/roomtype/${boardingHouseId}/create`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
        );
        return response.data;
    } catch (error) {
        handleError(error);
    }
};

export const updateRoomType = async (roomTypeId, formData) => {
    try {
        const response = await API.put(
            `/staff/boardinghouse/roomtype/${roomTypeId}/`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
        );
        return response.data;
    } catch (error) {
        handleError(error);
    }
};

export const deleteRoomType = async (roomTypeId) => {
    try {
        const response = await API.delete(
            `/staff/boardinghouse/roomtype/${roomTypeId}/`
        );
        return response.data;
    } catch (error) {
        handleError(error);
    }
};
