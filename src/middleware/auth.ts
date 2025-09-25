import { Response, NextFunction } from "express";
import { JWTHelper } from "../utils/jwtHelper";
import { AuthService } from "../services/AuthService";
import { AuthenticatedRequest, ApiResponse } from "../types";

export class AuthMiddleware {
  static async authenticate(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        const response: ApiResponse = {
          success: false,
          message: "Access token required",
        };
        res.status(401).json(response);
        return;
      }

      const token = authHeader.substring(7);

      // Check if token is blacklisted
      if (AuthService.isTokenBlacklisted(token)) {
        const response: ApiResponse = {
          success: false,
          message: "Token has been invalidated",
        };
        res.status(401).json(response);
        return;
      }

      const decoded = JWTHelper.verifyToken(token);

      // Get user from database to ensure they still exist
      const user = await AuthService.validateUser(decoded.userId);

      req.user = user;
      next();
    } catch (error) {
      const errorMessage = (error as Error).message;
      let message = "Invalid token";

      if (errorMessage === "TOKEN_EXPIRED") {
        message = "Token has expired";
      } else if (errorMessage === "USER_NOT_FOUND") {
        message = "User not found";
      }

      const response: ApiResponse = {
        success: false,
        message,
      };
      res.status(401).json(response);
    }
  }
}
