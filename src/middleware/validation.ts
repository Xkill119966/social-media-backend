import { Request, Response, NextFunction } from "express";
import { ZodType, ZodError } from "zod";
import { ApiResponse } from "../types";

export class ValidationMiddleware {
  static validate(schema: ZodType) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const validatedData = schema.parse(req.body);
        req.body = validatedData;
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          const response: ApiResponse = {
            success: false,
            message: "Validation error",
            errors: error.issues.map((issue) => ({
              field: issue.path.join("."),
              message: issue.message,
            })),
          };
          res.status(400).json(response);
          return;
        }

        const response: ApiResponse = {
          success: false,
          message: "Internal server error",
        };
        res.status(500).json(response);
      }
    };
  }

  static validateQuery(schema: ZodType) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const validatedData = schema.parse(req.query);
        req.query = validatedData as any;
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          const response: ApiResponse = {
            success: false,
            message: "Query validation error",
            errors: error.issues.map((issue) => ({
              field: issue.path.join("."),
              message: issue.message,
            })),
          };
          res.status(400).json(response);
          return;
        }

        const response: ApiResponse = {
          success: false,
          message: "Internal server error",
        };
        res.status(500).json(response);
      }
    };
  }
}
