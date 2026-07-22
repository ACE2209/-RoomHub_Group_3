import dotenv from "dotenv";
import { verifyToken } from "../utils/functions.js";

dotenv.config();

/**
 * General authentication and role authorization middleware.
 * @param {Array<string>} allowedRoles roles allowed to access the route
 * @param {{message?: string, code?: string}} options custom forbidden response
 */
const authorize = (allowedRoles = [], options = {}) => {
  const normalizedAllowedRoles = allowedRoles.map((role) =>
    String(role || "").toLowerCase()
  );

  return (req, res, next) => {
    const authorization = req?.headers?.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Unauthorized",
        code: "UNAUTHORIZED",
      });
    }

    const token = authorization.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized",
        code: "UNAUTHORIZED",
      });
    }

    try {
      const decoded = verifyToken(token);
      const role = String(decoded?.role || "").toLowerCase();

      if (
        normalizedAllowedRoles.length > 0 &&
        !normalizedAllowedRoles.includes(role)
      ) {
        return res.status(403).json({
          message: options.message || "Forbidden",
          code: options.code || "ROLE_FORBIDDEN",
        });
      }

      req.user = {
        ...decoded,
        role,
      };
      next();
    } catch (error) {
      return res.status(401).json({
        message: "Token is invalid",
        code: "INVALID_TOKEN",
      });
    }
  };
};

const authMiddleware = authorize();
const userMiddleware = authorize(["user"], {
  message: "Only user accounts can access this feature.",
  code: "USER_ROLE_REQUIRED",
});
const staffMiddleware = authorize(["staff", "owner"]);
const ownerMiddleware = authorize(["owner"]);
const adminMiddleware = authorize(["admin"]);

export {
  authMiddleware,
  userMiddleware,
  staffMiddleware,
  ownerMiddleware,
  adminMiddleware,
};
