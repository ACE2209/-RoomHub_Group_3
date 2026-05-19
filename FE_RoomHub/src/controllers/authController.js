// Import thư viện axios để gọi API
import axios from "axios";

// Import hàm tạo axios instance có JWT interceptor
import { createAxios } from "../utils/createInstance";

// Import thư viện hiển thị thông báo (toast)
import { toast } from "react-toastify";

// Import biến chứa base URL của API
import { API_BASE_URL } from "../utils/constant";

// Tạo axios instance có gắn accessToken tự động
const axiosJWT = createAxios();

/*
========================================
LOGIN USER
========================================
*/
export const loginUser = async (user, navigate) => {
  try {
    // Gửi request POST đến API login
    const res = await axios.post(`${API_BASE_URL}/auth/login`, user, {
      withCredentials: true, // cho phép gửi cookie (refresh token)
    });

    // Lưu thông tin user vào localStorage
    localStorage.setItem("user", JSON.stringify(res.data.data));

    // Lưu accessToken để dùng cho các API cần authentication
    localStorage.setItem("accessToken", res.data.data.accessToken);

    // Điều hướng:
    // Nếu là admin -> /admin
    // Nếu là user -> /
    navigate(res.data.data.isAdmin ? "/admin" : "/");

    // Hiển thị thông báo login thành công
    toast.success(res.data.message);

    // Trả về data user
    return res.data.data;
  } catch (error) {
    // Nếu lỗi thì trả về message lỗi
    throw error.response?.data || { message: "Login failed" };
  }
};

/*
========================================
REGISTER USER
========================================
*/
export const registerUser = async (user, navigate) => {
  try {
    // Gửi request POST để đăng ký tài khoản
    const res = await axios.post(`${API_BASE_URL}/auth/register`, user);

    // Trả dữ liệu về (thường là yêu cầu nhập OTP)
    return res.data;
  } catch (error) {
    // Bắt lỗi nếu đăng ký thất bại
    throw error.response?.data || { message: "Registration failed" };
  }
};

/*
========================================
VERIFY OTP REGISTER
========================================
*/
export const verifyOTPRegister = async (email, otp) => {
  try {
    // Gửi OTP + email để xác thực đăng ký
    const res = await axios.post(`${API_BASE_URL}/auth/verify-otp-register`, {
      email,
      otp,
    });

    // Thông báo đăng ký thành công
    toast.success("Registration successful! Please log in to continue.");

    return res.data;
  } catch (error) {
    // Nếu OTP sai hoặc lỗi
    throw error.response?.data || { message: "Failed to verify OTP" };
  }
};

/*
========================================
GET ALL USERS (ADMIN)
========================================
*/
export const getAllUsers = async () => {
  try {
    // Gọi API lấy danh sách user (cần token)
    const res = await axiosJWT.get("/users");

    // Trả danh sách user
    return res.data.data;
  } catch (error) {
    // Lỗi khi lấy danh sách
    throw error.response?.data || { message: "Failed to get users" };
  }
};

/*
========================================
DELETE USER (ADMIN)
========================================
*/
export const deleteUser = async (id) => {
  try {
    // Gọi API xoá user theo id
    const res = await axiosJWT.delete(`/users/${id}`);

    return res.data;
  } catch (error) {
    // Lỗi khi xoá
    throw error.response?.data || { message: "Failed to delete user" };
  }
};

/*
========================================
LOGOUT USER
========================================
*/
export const logout = async (navigate) => {
  try {
    // Gọi API logout (server sẽ xoá refresh token)
    await axiosJWT.post("/auth/logout", {});

    // Xoá dữ liệu user trong localStorage
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");

    // Điều hướng về trang home
    navigate("/");

    // Thông báo logout thành công
    toast.success("Logout Successfully");
  } catch (error) {
    // Nếu logout lỗi
    throw error.response?.data || { message: "Logout failed" };
  }
};