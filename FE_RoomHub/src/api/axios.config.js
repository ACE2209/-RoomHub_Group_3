import axios from "axios";

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
});

instance.interceptors.request.use(
  function (config) {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  function (response) {
    if (response?.data) {
      return response.data;
    }

    return response;
  },
  function (error) {
    const status = error?.response?.status;
    const requestUrl = String(error?.config?.url || "");
    const hadToken = Boolean(localStorage.getItem("token"));

    const isLoginRequest = requestUrl.includes("/login");
    const isOnLoginPage = window.location.pathname === "/login";

    if (status === 401 && hadToken && !isLoginRequest) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (!isOnLoginPage) {
        window.location.replace("/login");
      }
    }

    return Promise.reject(error);
  }
);

export default instance;