import axios from "./axios.config";

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
