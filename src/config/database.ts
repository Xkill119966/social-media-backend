import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

class Database {
  private pool: mysql.Pool | null = null;
  private isConnecting: boolean = false;
  private connectionAttempts: number = 0;
  private readonly maxRetries: number = 3;
  private readonly retryDelay: number = 5000; // 5 seconds

  async connect(): Promise<mysql.Pool> {
    if (this.pool) {
      return this.pool;
    }

    if (this.isConnecting) {
      // Wait for existing connection attempt
      while (this.isConnecting) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      if (this.pool) {
        return this.pool;
      }
    }

    this.isConnecting = true;

    try {
      await this.attemptConnection();
      this.connectionAttempts = 0;
      console.log("✅ Database pool created successfully");
      return this.pool!;
    } catch (error) {
      console.error("❌ Database connection failed:", (error as Error).message);
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  private async attemptConnection(): Promise<void> {
    while (this.connectionAttempts < this.maxRetries) {
      try {
        const connectionConfig: mysql.PoolOptions = {
          host: process.env.DB_HOST,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
          charset: "utf8mb4",
          connectTimeout: 10000, // 10 seconds
          connectionLimit: 10, // Maximum number of connections
          queueLimit: 0, // Unlimited queue
        };

        // Only add SSL config if enabled
        if (process.env.DB_SSL === "true") {
          connectionConfig.ssl = {
            rejectUnauthorized: false,
          };
        }

        this.pool = mysql.createPool(connectionConfig);

        // Test the connection
        const connection = await this.pool.getConnection();
        await connection.ping();
        connection.release();

        // Setup connection event handlers
        this.setupConnectionHandlers();

        return;
      } catch (error) {
        this.connectionAttempts++;
        console.error(
          `❌ Connection attempt ${this.connectionAttempts} failed:`,
          (error as Error).message
        );

        if (this.connectionAttempts >= this.maxRetries) {
          throw new Error(
            `Failed to connect to database after ${this.maxRetries} attempts`
          );
        }

        console.log(
          `⏳ Retrying connection in ${this.retryDelay / 1000} seconds...`
        );
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
      }
    }
  }

  private setupConnectionHandlers(): void {
    if (!this.pool) return;

    // Pool doesn't emit connection errors directly, but we can listen on the connection
    this.pool.on("connection", (connection) => {
      console.log("New connection established in pool");
    });

    this.pool.on("acquire", (connection) => {
      // Connection acquired from pool
    });
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    try {
      if (!this.pool) {
        throw new Error("Database pool not initialized");
      }

      // Log the query in development for debugging
      if (process.env.NODE_ENV === "development") {
        console.log("Executing query:", sql, "with params:", params);
      }

      const [rows] = await this.pool.query(sql, params);
      return rows as T[];
    } catch (error) {
      console.error("Query error:", (error as Error).message);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.pool) {
      try {
        console.log("🔌 Closing database pool...");
        await this.pool.end();
        this.pool = null;
        console.log("✅ Database pool closed gracefully");
      } catch (error) {
        console.error("❌ Error closing database pool:", error);
        throw error;
      }
    }
  }

  // Check if database is connected
  isConnected(): boolean {
    return this.pool !== null;
  }

  // Get connection status
  getConnectionStatus(): string {
    if (this.isConnecting) return "connecting";
    if (this.pool) return "connected";
    return "disconnected";
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.pool) {
        return false;
      }
      const connection = await this.pool.getConnection();
      await connection.ping();
      connection.release();
      return true;
    } catch (error) {
      console.error("Database health check failed:", error);
      return false;
    }
  }
}

export default new Database();
