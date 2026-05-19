import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { API_BASE_URL } from "./constant";

/*
========================================
REFRESH TOKEN
========================================
Hàm này gọi API để lấy accessToken mới
khi accessToken hiện tại đã hết hạn
*/
const refreshToken = async () => {
  try {
    const res = await axios.post(
      `${API_BASE_URL}/auth/refresh-token`,
      {},
      { withCredentials: true } // gửi cookie chứa refreshToken
    );

    // trả về dữ liệu từ server (thường chứa accessToken mới)
    return res?.data;
  } catch (error) {
    // nếu refresh thất bại thì trả null
    return null;
  }
};

/*
========================================
CREATE AXIOS INSTANCE
========================================
Tạo một axios instance riêng để:
- tự động gắn Authorization token
- tự động refresh token nếu hết hạn
*/
export const createAxios = () => {
  const newInstance = axios.create({
    baseURL: API_BASE_URL, // base url cho tất cả request
    withCredentials: true, // cho phép gửi cookie
  });

  /*
  ========================================
  REQUEST INTERCEPTOR
  ========================================
  Chạy trước khi gửi request lên server
  Dùng để:
  - kiểm tra accessToken
  - refresh token nếu hết hạn
  - gắn Authorization header
  */
  newInstance.interceptors.request.use(
    async (config) => {
      // lấy user và accessToken từ localStorage
      const user = JSON.parse(localStorage.getItem("user"));
      let token = localStorage.getItem("accessToken");

      // nếu không có token hoặc user thì gửi request bình thường
      if (!token || !user) {
        return config;
      }

      try {
        // decode token để lấy thời gian hết hạn
        const decodedToken = jwtDecode(token);

        // thời gian hiện tại
        const currentTime = Date.now() / 1000;

        /*
        ========================================
        CHECK TOKEN EXPIRED
        ========================================
        nếu token hết hạn thì gọi refreshToken
        */
        if (decodedToken.exp < currentTime) {
          const data = await refreshToken();

          if (data?.accessToken) {
            // cập nhật accessToken mới vào localStorage
            const updatedUser = { ...user, accessToken: data.accessToken };

            localStorage.setItem("user", JSON.stringify(updatedUser));
            localStorage.setItem("accessToken", data.accessToken);

            token = data.accessToken;
          } else {
            // nếu refresh token fail → logout
            localStorage.removeItem("user");
            localStorage.removeItem("accessToken");

            return config;
          }
        }

        /*
        ========================================
        ADD AUTHORIZATION HEADER
        ========================================
        gắn accessToken vào header
        */
        config.headers["Authorization"] = `Bearer ${token}`;

        return config;
      } catch (error) {
        // nếu decode token lỗi thì vẫn gửi request
        return config;
      }
    },
    (error) => Promise.reject(error)
  );

  return newInstance;
};