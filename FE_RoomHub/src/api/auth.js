import axios from "axios";

const API_URL = "http://localhost:3000";

export const loginAPI = async (data) => {
    const response = await axios.post(
        `${API_URL}/login`,
        data
    );

    return response.data;
};

export const registerAPI = async (data) => {
    const response = await axios.post(
        `${API_URL}/verify-register`,
        data
    );

    return response.data;
};

export const sendOTPAPI = async (data) => {
    const response = await axios.post(
        `${API_URL}/send-otp-register`,
        data
    );

    return response.data;
};