import { Request, Response } from "express";
import { ApiResponse } from "../types";

export interface ErrorDetails {
  statusCode: number;
  message: string;
  errors?: Array<{ field: string; message: string }>;
  code?: string;
}

export class ErrorHandler {
  /**
   * Handle application errors and return appropriate HTTP response
   */
  static handleError(error: Error, req: Request, res: Response): void {
    const errorDetails = this.analyzeError(error);

    // Log error details
    this.logError(error, req, errorDetails);

    // Send response
    const response: ApiResponse = {
      success: false,
      message: errorDetails.message,
      ...(errorDetails.errors && { errors: errorDetails.errors }),
    };

    res.status(errorDetails.statusCode).json(response);
  }

  /**
   * Analyze error and determine appropriate response details
   */
  private static analyzeError(error: Error): ErrorDetails {
    const errorName = error.name;
    const errorMessage = error.message;
    const errorCode = (error as any).code;

    // Database errors

    if (errorCode === "ECONNREFUSED") {
      return {
        statusCode: 503,
        message: "Database connection failed",
        code: "DATABASE_UNAVAILABLE",
      };
    }

    // JWT errors
    if (errorName === "JsonWebTokenError") {
      return {
        statusCode: 401,
        message: "Invalid authentication token",
        code: "INVALID_TOKEN",
      };
    }

    if (errorName === "TokenExpiredError") {
      return {
        statusCode: 401,
        message: "Authentication token has expired",
        code: "TOKEN_EXPIRED",
      };
    }

    // Validation errors
    if (errorName === "ValidationError") {
      const errors: Array<{ field: string; message: string }> = [];

      if ((error as any).details) {
        (error as any).details.forEach((detail: any) => {
          errors.push({
            field: detail.path?.join(".") || "unknown",
            message: detail.message,
          });
        });
      }

      return {
        statusCode: 400,
        message: "Validation failed",
        errors,
        code: "VALIDATION_ERROR",
      };
    }

    // Multer (file upload) errors
    if (errorName === "MulterError") {
      return {
        statusCode: 400,
        message: this.getMulterErrorMessage((error as any).code),
        code: "FILE_UPLOAD_ERROR",
      };
    }

    // Syntax errors (malformed JSON, etc.)
    if (errorName === "SyntaxError" && "body" in error) {
      return {
        statusCode: 400,
        message: "Invalid JSON in request body",
        code: "INVALID_JSON",
      };
    }

    // Default error handling
    const isProduction = process.env.NODE_ENV === "production";

    return {
      statusCode: 500,
      message: isProduction
        ? "An unexpected error occurred"
        : errorMessage || "Internal server error",
      code: "INTERNAL_ERROR",
    };
  }

  /**
   * Get user-friendly message for Multer errors
   */
  private static getMulterErrorMessage(code: string): string {
    switch (code) {
      case "LIMIT_FILE_SIZE":
        return "File size exceeds the maximum allowed limit";
      case "LIMIT_FILE_COUNT":
        return "Too many files uploaded at once";
      case "LIMIT_FIELD_KEY":
        return "Field name is too long";
      case "LIMIT_FIELD_VALUE":
        return "Field value is too long";
      case "LIMIT_FIELD_COUNT":
        return "Too many form fields";
      case "LIMIT_UNEXPECTED_FILE":
        return "Unexpected file field in upload";
      case "MISSING_FIELD_NAME":
        return "Missing field name in file upload";
      default:
        return "File upload failed";
    }
  }

  /**
   * Log error with appropriate level and context
   */
  private static logError(
    error: Error,
    req: Request,
    errorDetails: ErrorDetails
  ): void {
    const logData = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      },
      request: {
        method: req.method,
        url: req.url,
        userAgent: req.get("User-Agent"),
        ip: req.ip,
      },
      response: {
        statusCode: errorDetails.statusCode,
        message: errorDetails.message,
      },
    };

    // Log based on severity
    if (errorDetails.statusCode >= 500) {
      console.error("🚨 Server Error:", logData);
    } else if (errorDetails.statusCode >= 400) {
      console.warn("⚠️ Client Error:", logData);
    } else {
      console.info("ℹ️ Request Error:", logData);
    }

    // In production, you might want to send to external logging service
    if (
      process.env.NODE_ENV === "production" &&
      errorDetails.statusCode >= 500
    ) {
      // Example: Send to logging service
      // await LoggingService.logError(logData);
    }
  }

  /**
   * Create a standardized error object
   */
  static createError(
    message: string,
    statusCode: number = 500,
    code?: string
  ): Error {
    const error = new Error(message);
    (error as any).statusCode = statusCode;
    (error as any).code = code;
    return error;
  }

  /**
   * Check if error is operational (expected) vs programming error
   */
  static isOperationalError(error: Error): boolean {
    const operationalErrors = [
      "ValidationError",
      "CastError",
      "JsonWebTokenError",
      "TokenExpiredError",
      "MulterError",
    ];

    const operationalCodes = [
      "ER_DUP_ENTRY",
      "ER_NO_REFERENCED_ROW_2",
      "ER_ROW_IS_REFERENCED_2",
      "ECONNREFUSED",
      "ENOTFOUND",
    ];

    return (
      operationalErrors.includes(error.name) ||
      operationalCodes.includes((error as any).code) ||
      error.message.startsWith("EMAIL_ALREADY_EXISTS") ||
      error.message.startsWith("INVALID_CREDENTIALS") ||
      error.message.startsWith("USER_NOT_FOUND") ||
      error.message.startsWith("POST_NOT_FOUND") ||
      error.message.startsWith("UNAUTHORIZED_") ||
      error.message.startsWith("WEAK_PASSWORD")
    );
  }
}
