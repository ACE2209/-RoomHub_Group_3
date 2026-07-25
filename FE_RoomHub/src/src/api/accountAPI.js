import axiosClient from "./axios.config";
import axios from "axios";

import API_URL from "./config";

export const updateAccountFromProfile = (data) => {
  return axiosClient.put("auth/profile", data);
};

export const sendOTPChangeEmail = (data) => {
  return axiosClient.post("auth/send-otp-change-email", data);
};

export const verifyChangeEmail = (data) => {
  return axiosClient.post("auth/verify-change-email", data);
};

export const updateAvatar = (data) => {
  return axiosClient.put("auth/avatar", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

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

export const getProfileAPI = async () => {
    return axiosClient.get("auth/profile");
};

export const updateProfileAPI = async (data) => {
    return axiosClient.put("auth/profile", data);
};

export const sendOTPChangeEmailAPI = async (email) => {
    return axiosClient.post("auth/send-otp-change-email", { email });
};

export const verifyChangeEmailAPI = async (data) => {
    return axiosClient.post("auth/verify-change-email", data);
};
