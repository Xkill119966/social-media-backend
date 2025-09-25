export abstract class BaseService {
  /**
   * Log service operation
   */
  protected static log(
    level: "info" | "warn" | "error",
    message: string,
    data?: any
  ): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      service: this.name,
      message,
      data,
    };

    switch (level) {
      case "info":
        console.log("ℹ️ Service Info:", logEntry);
        break;
      case "warn":
        console.warn("⚠️ Service Warning:", logEntry);
        break;
      case "error":
        console.error("❌ Service Error:", logEntry);
        break;
    }
  }
}
