import dotenv from "dotenv";
import { verifyToken } from "../utils/functions.js";
dotenv.config();

/**
 * Middleware tổng quát kiểm tra xác thực và phân quyền
 * @param {Array<string>} allowedRoles - Các vai trò được phép truy cập (có thể bỏ trống để chỉ kiểm tra xác thực)
 */
const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    const authorization = req?.headers["authorization"];
    if (!authorization) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authorization.split(" ")[1];
    try {
      const decoded = verifyToken(token);
      // Nếu có role yêu cầu thì kiểm tra
      if (allowedRoles.length && !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ message: "Token is invalid" });
    }
  };
};

// Các middleware cụ thể
const authMiddleware = authorize();
const staffMiddleware = authorize(["staff", "owner"]);
const ownerMiddleware = authorize(["owner"]);
const adminMiddleware = authorize(["admin"]);

export { authMiddleware, staffMiddleware, ownerMiddleware, adminMiddleware };
