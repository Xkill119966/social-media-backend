import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { AuthMiddleware } from "../middleware/auth";
import { ValidationMiddleware } from "../middleware/validation";
import { RateLimiter } from "../middleware/rateLimiter";
import { registerSchema, loginSchema } from "../schemas/validation";
import { AuthenticatedRequest } from "../types";

const router = Router();
const authController = new AuthController();

// Public routes with strict rate limiting
router.post(
  "/register",
  ValidationMiddleware.validate(registerSchema),
  (req, res) => authController.register(req, res)
);

router.post(
  "/login",
  RateLimiter.auth,
  ValidationMiddleware.validate(loginSchema),
  (req, res) => authController.login(req, res)
);

// Protected routes
router.post("/logout", AuthMiddleware.authenticate, (req, res) =>
  authController.logout(req as AuthenticatedRequest, res)
);

router.get("/profile", AuthMiddleware.authenticate, (req, res) =>
  authController.profile(req as AuthenticatedRequest, res)
);

export default router;
