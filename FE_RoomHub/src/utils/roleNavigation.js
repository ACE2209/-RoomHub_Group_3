export const normalizeRole = (role) => String(role || "").trim().toLowerCase();

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch (error) {
    return null;
  }
};

export const getRoleHomePath = (role) => {
  switch (normalizeRole(role)) {
    case "admin":
      return "/admin";
    case "owner":
    case "staff":
      return "/my-boarding-houses";
    case "user":
      return "/";
    default:
      return "/login";
  }
};

export const isManagementRole = (role) =>
  ["admin", "owner", "staff"].includes(normalizeRole(role));
