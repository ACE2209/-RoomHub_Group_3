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

export const forgotPasswordAPI = async (data) => {
    const res = await axios.post(
        `${API_URL}/forgot-password`,
        data
    );

    return res.data;
};

export const resetPasswordAPI = async (data) => {
    const res = await axios.post(
        `${API_URL}/reset-password`,
        data
    );

    return res.data;
};

export const changePasswordAPI = async (data) => {
    const token = localStorage.getItem("token");

    const res = await axios.post(
        `${API_URL}/auth/change-password`,
        data,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return res.data;
};