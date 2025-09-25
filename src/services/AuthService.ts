import { User } from "../models/User";
import { RegisterInput, LoginInput } from "../schemas/validation";
import { User as UserType, UserProfile } from "../types";
import { BaseService } from "./BaseService";
import { JWTHelper } from "../utils/jwtHelper";

export interface AuthResult {
  user: Omit<UserType, "password">;
  token: string;
}

export interface LoginResult extends AuthResult {}

export interface RegisterResult extends AuthResult {}

export class AuthService extends BaseService {
  /**
   * In-memory store for blacklisted tokens
   * In production, use Redis or a database for persistence
   */
  private static tokenBlacklist: Set<string> = new Set();

  /**
   * Register a new user
   */
  static async register(userData: RegisterInput): Promise<RegisterResult> {
    const { name, email, password } = userData;

    // Check if user already exists
    const isExistingUser = await this.isEmailAvailable(email);
    if (isExistingUser) {
      throw new Error("EMAIL_ALREADY_EXISTS");
    }

    // Create new user
    const user = await User.create({ name, email, password });

    // Generate JWT token
    const token = JWTHelper.generateToken(user.id, "access");

    this.log("info", "User registered successfully", {
      userId: user.id,
      email,
    });

    return {
      user: user.toJSON(),
      token,
    };
  }

  /**
   * Authenticate user login
   */
  static async login(credentials: LoginInput): Promise<LoginResult> {
    const { email, password } = credentials;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      throw new Error("INVALID_CREDENTIALS");
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      throw new Error("INVALID_CREDENTIALS");
    }

    // Generate JWT token
    const token = JWTHelper.generateToken(user.id, "access");

    this.log("info", "User logged in successfully", { userId: user.id, email });

    return {
      user: user.toJSON(),
      token,
    };
  }

  /**
   * Get user profile with statistics
   */
  static async getProfile(userId: number): Promise<UserProfile> {
    const profile = await User.getProfile(userId);
    if (!profile) {
      throw new Error("USER_NOT_FOUND");
    }

    return profile;
  }

  /**
   * Check if email is available
   */
  static async isEmailAvailable(email: string): Promise<boolean> {
    const existingUser = await User.findByEmail(email);
    console.log(existingUser);
    return !!existingUser; // Typecast to boolean
  }

  /**
   * Logout user (invalidate token)
   */
  static async logout(token: string): Promise<void> {
    try {
      const decoded = JWTHelper.verifyToken(token);

      // Add token to blacklist
      this.tokenBlacklist.add(token);

      // Optional: Set a timeout to remove the token from blacklist after it expires
      // This is a simple cleanup mechanism for in-memory storage
      const expirationTime = JWTHelper.getTokenExpiration(token);
      if (expirationTime > 0) {
        setTimeout(() => {
          this.tokenBlacklist.delete(token);
        }, expirationTime * 1000);
      }

      this.log("info", "User logged out", { userId: decoded.userId });
    } catch (error) {
      // Token might be invalid, but logout should still succeed
      this.log("warn", "Logout attempted with invalid token");
    }
  }

  static async validateUser(
    userId: number
  ): Promise<Omit<UserType, "password">> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }
    return user.toJSON();
  }

  /**
   * Check if a token is blacklisted
   */
  static isTokenBlacklisted(token: string): boolean {
    return this.tokenBlacklist.has(token);
  }
}
