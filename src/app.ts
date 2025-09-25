import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";

// Import routes
import authRoutes from "./routes/auth";
import postRoutes from "./routes/posts";
import { ApiResponse } from "./types";
import { RateLimiter } from "./middleware/rateLimiter";
import { ErrorHandler } from "./utils/errorHandler";

dotenv.config();

class App {
  public app: express.Application;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Trust proxy for accurate IP addresses (important for rate limiting)
    this.app.set("trust proxy", 1);

    // CORS
    this.app.use(cors());

    // Body parsing
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true }));

    // Global rate limiting and slow down
    if (process.env.RATE_LIMIT_ENABLED !== "false") {
      this.app.use(RateLimiter.general);
    }

    // Static files
    this.app.use(
      "/uploads",
      express.static(path.join(__dirname, "../uploads"))
    );
  }

  private setupRoutes(): void {
    // Health check
    this.app.get("/health", async (req: Request, res: Response) => {
      try {
        const database = (await import("./config/database")).default;
        const dbHealthy = await database.healthCheck();

        const response: ApiResponse = {
          success: true,
          message: "API is running",
          data: {
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database: {
              status: database.getConnectionStatus(),
              healthy: dbHealthy,
            },
            security: {
              rateLimitEnabled: process.env.RATE_LIMIT_ENABLED !== "false",
            },
            environment: process.env.NODE_ENV || "development",
          },
        };

        // Return 503 if database is not healthy
        const statusCode = dbHealthy ? 200 : 503;
        res.status(statusCode).json(response);
      } catch (error) {
        const response: ApiResponse = {
          success: false,
          message: "Health check failed",
          data: {
            timestamp: new Date().toISOString(),
            error: (error as Error).message,
          },
        };
        res.status(503).json(response);
      }
    });

    // API routes
    this.app.use("/api", authRoutes);
    this.app.use("/api/posts", postRoutes);

    // 404 handler
    this.app.use("*", (req: Request, res: Response) => {
      const response: ApiResponse = {
        success: false,
        message: "Route not found",
      };
      res.status(404).json(response);
    });
  }

  private setupErrorHandling(): void {
    this.app.use(
      (error: Error, req: Request, res: Response, next: NextFunction) => {
        ErrorHandler.handleError(error, req, res);
      }
    );
  }

  public getApp(): express.Application {
    return this.app;
  }
}

export default new App().getApp();
