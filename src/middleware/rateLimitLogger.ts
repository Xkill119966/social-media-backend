import { Request, Response, NextFunction } from "express";

export interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime?: Date;
}

export class RateLimitLogger {
  static logRateLimit(req: Request, res: Response, next: NextFunction): void {
    // Log rate limit information if available
    if (req.rateLimit) {
      const rateLimitInfo: RateLimitInfo = {
        limit: req.rateLimit.limit,
        current: req.rateLimit.current,
        remaining: req.rateLimit.remaining,
        resetTime: req.rateLimit.resetTime
          ? new Date(req.rateLimit.resetTime)
          : undefined,
      };

      // Log to console in development
      if (process.env.NODE_ENV === "development") {
        console.log(`Rate limit info for ${req.ip}:`, rateLimitInfo);
      }

      // Add rate limit info to response headers
      res.set({
        "X-RateLimit-Limit": rateLimitInfo.limit.toString(),
        "X-RateLimit-Remaining": rateLimitInfo.remaining.toString(),
        "X-RateLimit-Reset": rateLimitInfo.resetTime
          ? rateLimitInfo.resetTime.toISOString()
          : "",
      });
    }

    next();
  }

  static logRateLimitHit(req: Request, res: Response): void {
    const logData = {
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get("User-Agent"),
      endpoint: `${req.method} ${req.path}`,
      rateLimitInfo: req.rateLimit,
    };

    console.warn("Rate limit exceeded:", logData);

    // In production, you might want to send this to a monitoring service
    // or store it in a database for analysis
  }
}
