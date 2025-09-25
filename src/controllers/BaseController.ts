import { Request, Response } from "express";
import { ApiResponse, AuthenticatedRequest } from "../types";

export class BaseController {
  // Send success response
  protected sendSuccess<T = any>(
    res: Response,
    data?: T,
    message?: string,
    statusCode: number = 200
  ): void {
    const response: ApiResponse<T> = {
      success: true,
      message: message || "Operation successful",
      data,
    };

    res.status(statusCode).json(response);
  }

  // Send created response (201)
  protected sendCreated<T = any>(
    res: Response,
    data?: T,
    message?: string
  ): void {
    this.sendSuccess(
      res,
      data,
      message || "Resource created successfully",
      201
    );
  }

  // Send error response
  protected sendError(
    res: Response,
    message: string,
    statusCode: number = 500,
    errors?: Array<{ field: string; message: string }>
  ): void {
    const response: ApiResponse = {
      success: false,
      message,
      errors,
    };

    res.status(statusCode).json(response);
  }

  // Send validation error response (400)
  protected sendValidationError(
    res: Response,
    errors: Array<{ field: string; message: string }>,
    message: string = "Validation failed"
  ): void {
    this.sendError(res, message, 400, errors);
  }

  // Send unauthorized response (401)
  protected sendUnauthorized(
    res: Response,
    message: string = "Unauthorized access"
  ): void {
    this.sendError(res, message, 401);
  }

  // Send forbidden response (403)
  protected sendForbidden(
    res: Response,
    message: string = "Access forbidden"
  ): void {
    this.sendError(res, message, 403);
  }

  // Send not found response (404)
  protected sendNotFound(
    res: Response,
    message: string = "Resource not found"
  ): void {
    this.sendError(res, message, 404);
  }

  // Extract and validate numeric ID from params
  protected extractNumericId(
    req: Request,
    paramName: string,
    res: Response
  ): number | null {
    const id = parseInt(req.params[paramName]);

    if (isNaN(id) || id <= 0) {
      this.sendValidationError(res, [
        { field: paramName, message: `Invalid ${paramName}` },
      ]);
      return null;
    }

    return id;
  }

  // Handle service errors with appropriate HTTP responses
  protected handleServiceError(
    error: Error,
    res: Response,
    operation: string = "operation"
  ): void {
    console.error(`${operation} error:`, error);

    const errorMessage = error.message;

    // Authentication errors
    if (errorMessage === "EMAIL_ALREADY_EXISTS") {
      this.sendConflict(res, "Email already registered");
      return;
    }

    if (errorMessage === "INVALID_CREDENTIALS") {
      this.sendUnauthorized(res, "Invalid credentials");
      return;
    }

    if (errorMessage === "USER_NOT_FOUND") {
      this.sendNotFound(res, "User not found");
      return;
    }

    if (errorMessage === "INVALID_TOKEN" || errorMessage === "TOKEN_EXPIRED") {
      this.sendUnauthorized(res, "Invalid or expired token");
      return;
    }

    // Post errors
    if (errorMessage === "POST_NOT_FOUND") {
      this.sendNotFound(res, "Post not found");
      return;
    }

    if (errorMessage === "UNAUTHORIZED_POST_ACCESS") {
      this.sendForbidden(res, "Unauthorized to access this post");
      return;
    }

    // Validation errors
    if (errorMessage.startsWith("INVALID_")) {
      this.sendValidationError(res, [
        {
          field: "general",
          message: errorMessage.replace("INVALID_", "").toLowerCase(),
        },
      ]);
      return;
    }

    if (errorMessage.startsWith("MISSING_REQUIRED_FIELDS:")) {
      const fields = errorMessage
        .replace("MISSING_REQUIRED_FIELDS: ", "")
        .split(", ");
      const errors = fields.map((field) => ({
        field,
        message: `${field} is required`,
      }));
      this.sendValidationError(res, errors, "Missing required fields");
      return;
    }

    // Default to internal server error
    this.sendInternalError(res, "An unexpected error occurred");
  }

  // Send conflict response (409)
  protected sendConflict(
    res: Response,
    message: string = "Resource conflict"
  ): void {
    this.sendError(res, message, 409);
  }

  // Send internal server error response (500)
  protected sendInternalError(
    res: Response,
    message: string = "Internal server error"
  ): void {
    this.sendError(res, message, 500);
  }
}
