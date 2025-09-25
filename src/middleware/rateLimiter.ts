import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import { Request, Response } from "express";
import { ApiResponse } from "../types";
import { RateLimitLogger } from "./rateLimitLogger";

// Custom key generator that includes user ID for authenticated requests
const createKeyGenerator = (includeUserId: boolean = false) => {
  return (req: Request): string => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (includeUserId && (req as any).user?.id) {
      return `${ip}:${(req as any).user.id}`;
    }
    return ip;
  };
};

// Custom error handler for rate limiting
const rateLimitHandler = (req: Request, res: Response): void => {
  // Log the rate limit hit
  RateLimitLogger.logRateLimitHit(req, res);

  const response: ApiResponse = {
    success: false,
    message: "Too many requests, please try again later.",
    data: {
      retryAfter: Math.round(
        req.rateLimit?.resetTime
          ? (req.rateLimit.resetTime - Date.now()) / 1000
          : 60
      ),
      limit: req.rateLimit?.limit,
      remaining: req.rateLimit?.remaining,
    },
  };
  res.status(429).json(response);
};

export class RateLimiter {
  // General API rate limiter - 100 requests per 15 minutes
  static general = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: rateLimitHandler,
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    keyGenerator: createKeyGenerator(false),
  });

  // Auth endpoints - 10 req / 15 min
  static auth = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many login attempts. Try again later.",
  });

  // Posting endpoints - 10 posts/comments per min
  static posting = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    message: "You're posting too fast. Please wait.",
  });
}
