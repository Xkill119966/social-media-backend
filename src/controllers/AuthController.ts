import { Request, Response } from "express";
import { AuthService } from "../services/AuthService";
import { AuthenticatedRequest } from "../types";
import { RegisterInput, LoginInput } from "../schemas/validation";
import { BaseController } from "./BaseController";

export class AuthController extends BaseController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const userData: RegisterInput = req.body;
      const result = await AuthService.register(userData);

      this.sendCreated(res, result, "User registered successfully");
    } catch (error) {
      this.handleServiceError(error as Error, res, "User registration");
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const credentials: LoginInput = req.body;
      const result = await AuthService.login(credentials);

      this.sendSuccess(res, result, "Login successful");
    } catch (error) {
      this.handleServiceError(error as Error, res, "Login");
    }
  }

  async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const token = req.headers.authorization?.substring(7); // Remove "Bearer " prefix

      if (token) {
        // Call the AuthService logout method to handle token invalidation
        await AuthService.logout(token);
      }

      this.sendSuccess(res, undefined, "Logged out successfully");
    } catch (error) {
      this.handleServiceError(error as Error, res, "Logout");
    }
  }

  async profile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const profile = await AuthService.getProfile(req.user!.id);

      this.sendSuccess(res, profile, "Profile retrieved successfully");
    } catch (error) {
      this.handleServiceError(error as Error, res, "Profile retrieval");
    }
  }
}
