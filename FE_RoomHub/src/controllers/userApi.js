// userApi.js

// Import base URL của API (vd: http://localhost:5000/api)
import { API_BASE_URL } from "../utils/constant";

// Import hàm tạo axios instance có gắn JWT token
import { createAxios } from "../utils/createInstance";

/*
========================================
GET ALL USERS
========================================
Lấy danh sách tất cả user.
Có thể truyền tham số search để tìm kiếm user theo tên/email.
*/
export const getAllUsers = async (search = "") => {
  try {
    // Tạo query params cho URL (vd: ?search=tran)
    const queryParams = new URLSearchParams();

    // Nếu có search thì thêm vào query
    if (search) queryParams.append("search", search);

    // Tạo axios instance có token
    const axiosJWT = createAxios();

    // Gọi API GET /users
    const res = await axiosJWT.get(`${API_BASE_URL}/users?${queryParams}`);

    // Trả về danh sách user
    return res.data.data;
  } catch (error) {
    // Log lỗi ra console
    console.error("Error fetching users:", error);

    // Throw lỗi để component xử lý
    throw new Error(error.response?.data?.message || "Failed to fetch users");
  }
};

/*
========================================
GET USER BY ID
========================================
Lấy thông tin chi tiết của một user theo ID
*/
export const getUserById = async (userId) => {
  try {
    const axiosJWT = createAxios();

    // Gọi API GET /users/:id
    const res = await axiosJWT.get(`${API_BASE_URL}/users/${userId}`);

    return res.data.data;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw new Error(error.response?.data?.message || "Failed to fetch user");
  }
};

/*
========================================
UPDATE USER INFO
========================================
Cập nhật thông tin user (name, email, avatar...)
*/
export const updateUser = async (id, updateData) => {
  try {
    const axiosJWT = createAxios();

    // Gửi request PUT /users/:id
    const res = await axiosJWT.put(`${API_BASE_URL}/users/${id}`, updateData);

    return res.data.data;
  } catch (error) {
    console.error("Error updating user:", error);
    throw new Error(error.response?.data?.message || "Failed to update user");
  }
};

/*
========================================
UPDATE USER STATUS
========================================
Admin dùng để:
- Active user
- Block user
Cần password của admin để xác nhận
*/
export const updateStatusUser = async (userId, { status, password }) => {
  try {
    const axiosJWT = createAxios();

    // Gửi request PUT /users/:id/status
    const res = await axiosJWT.put(`${API_BASE_URL}/users/${userId}/status`, {
      status,    // active / inactive
      password,  // password admin xác nhận
    });

    return res.data.data;
  } catch (error) {
    console.error("Error updating user status:", error);
    throw new Error(
      error.response?.data?.message || "Failed to update user status"
    );
  }
};

/*
========================================
CHANGE PASSWORD
========================================
User đổi mật khẩu
Cần:
- oldPassword (mật khẩu cũ)
- newPassword (mật khẩu mới)
*/
export const changePassword = async ({ oldPassword, newPassword, userId }) => {
  try {
    const axiosJWT = createAxios();

    // Gửi request PUT /users/:id/change-password
    const res = await axiosJWT.put(
      `${API_BASE_URL}/users/${userId}/change-password`,
      {
        oldPassword,
        newPassword,
      }
    );

    return res.data;
  } catch (error) {
    console.error("Error changing password:", error);
    throw new Error(
      error.response?.data?.message || "Failed to change password"
    );
  }
};

/*
========================================
DELETE USER
========================================
Admin xoá user khỏi hệ thống
*/
export const deleteUser = async (id) => {
  try {
    const axiosJWT = createAxios();

    // Gửi request DELETE /users/:id
    const res = await axiosJWT.delete(`${API_BASE_URL}/users/${id}`);

    return res.data;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw new Error(error.response?.data?.message || "Failed to delete user");
  }
};