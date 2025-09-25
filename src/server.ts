import app from "./app";
import database from "./config/database";

class Server {
  private port: number;

  constructor(port: number) {
    this.port = port;
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      console.log("🔌 Connecting to database...");
      await database.connect();

      // Start server
      app.listen(this.port, () => {
        console.log(`🚀 Server running on port ${this.port}`);
        console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
        console.log(`⚡ Ready to accept connections!`);
      });
    } catch (error) {
      console.error("❌ Failed to start server:", error);
      await this.cleanup();
      process.exit(1);
    }
  }

  private async cleanup(): Promise<void> {
    try {
      console.log("🗄️ Closing database connection...");
      await database.close();
      console.log("✅ Database connection closed");
    } catch (error) {
      console.error("❌ Error closing database connection:", error);
      throw error;
    }
  }
}

const port = parseInt(process.env.PORT || "3000");

const server = new Server(port);
server.start();
