import axios from "./axios.config";

export const login = (data) => {
  return axios.post("/login", data);
};

export const getUser = () => {
  return axios.get("auth/user");
};

export const forgotPassword = (data) => {
  return axios.post("/forgot-password", data);
};

export const resetPassword = (data) => {
  return axios.post("/reset-password", data);
};
