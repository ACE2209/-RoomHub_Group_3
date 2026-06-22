import axios from "axios";

import API_URL from "./config";

const authHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

export const getAllAccountsAPI = async () => {
    const res = await axios.get(`${API_URL}/dashboard/accounts`, authHeader());
    return res.data;
};

export const filterAccountsAPI = async (params) => {
    const res = await axios.get(`${API_URL}/dashboard/accounts/filter`, {
        ...authHeader(),
        params,
    });
    return res.data;
};

export const createAccountAPI = async (data) => {
    const res = await axios.post(`${API_URL}/dashboard/accounts/create`, data, {
        ...authHeader(),
    });
    return res.data;
};

export const updateAccountAPI = async (accountId, data) => {
    const res = await axios.put(`${API_URL}/dashboard/accounts/${accountId}`, data, {
        ...authHeader(),
    });
    return res.data;
};

export const softDeleteAccountAPI = async (accountId) => {
    const res = await axios.delete(`${API_URL}/dashboard/accounts/${accountId}`, {
        ...authHeader(),
    });
    return res.data;
};

// lấy dữ liệu cho profile
export const getProfileAPI = async () => {
    const res = await axios.get(`${API_URL}/auth/profile`, {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    });
    return res.data;
};

// update profile
export const updateProfileAPI = async (data) => {
    const res = await axios.put(
        `${API_URL}/auth/profile`,
        data,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
    return res.data;
};

// gửi OTP đổi email
export const sendOTPChangeEmailAPI = async (email) => {
    const res = await axios.post(
        `${API_URL}/auth/send-otp-change-email`,
        { email },
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
    return res.data;
};

// xác thực OTP đổi email
export const verifyChangeEmailAPI = async (data) => {
    const res = await axios.post(
        `${API_URL}/auth/verify-change-email`,
        data,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        }
    );
    return res.data;
};
