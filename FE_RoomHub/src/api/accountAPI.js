import rawAxios from "axios";
import axios from "./axios.config";

import API_URL from "./config";

const authHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

export const getAllAccountsAPI = async () => {
    const res = await rawAxios.get(`${API_URL}/dashboard/accounts`, authHeader());
    return res.data;
};

export const filterAccountsAPI = async (params) => {
    const res = await rawAxios.get(`${API_URL}/dashboard/accounts/filter`, {
        ...authHeader(),
        params,
    });
    return res.data;
};

export const createAccountAPI = async (data) => {
    const res = await rawAxios.post(`${API_URL}/dashboard/accounts/create`, data, {
        ...authHeader(),
    });
    return res.data;
};

export const updateAccountAPI = async (accountId, data) => {
    const res = await rawAxios.put(`${API_URL}/dashboard/accounts/${accountId}`, data, {
        ...authHeader(),
    });
    return res.data;
};

export const softDeleteAccountAPI = async (accountId) => {
    const res = await rawAxios.delete(`${API_URL}/dashboard/accounts/${accountId}`, {
        ...authHeader(),
    });
    return res.data;
};

export const getProfileAPI = async () => {
    const res = await rawAxios.get(`${API_URL}/auth/profile`, authHeader());
    return res.data;
};

export const updateProfileAPI = async (data) => {
    const res = await rawAxios.put(`${API_URL}/auth/profile`, data, authHeader());
    return res.data;
};

export const sendOTPChangeEmailAPI = async (email) => {
    const res = await rawAxios.post(
        `${API_URL}/auth/send-otp-change-email`,
        { email },
        authHeader()
    );
    return res.data;
};

export const verifyChangeEmailAPI = async (data) => {
    const res = await rawAxios.post(
        `${API_URL}/auth/verify-change-email`,
        data,
        authHeader()
    );
    return res.data;
};

export const updateAccountFromProfile = (data) => {
    return axios.put("auth/profile", data);
};

export const sendOTPChangeEmail = (data) => {
    return axios.post("auth/send-otp-change-email", data);
};

export const verifyChangeEmail = (data) => {
    return axios.post("auth/verify-change-email", data);
};

export const updateAvatar = (data) => {
    return axios.put("auth/avatar", data, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};
