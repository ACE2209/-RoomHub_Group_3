import axios from "axios";

const API_URL = "http://localhost:3000";

const authHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
});

export const getProfileAPI = async () => {
    const res = await axios.get(`${API_URL}/auth/profile`, authHeader());
    return res.data;
};

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