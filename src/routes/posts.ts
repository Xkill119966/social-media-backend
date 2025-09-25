import { Router, Request, Response } from "express";
import { PostController } from "../controllers/PostController";
import { AuthMiddleware } from "../middleware/auth";
import { ValidationMiddleware } from "../middleware/validation";
import { upload } from "../middleware/upload";
import {
  postSchema,
  commentSchema,
  paginationSchema,
} from "../schemas/validation";
import { AuthenticatedRequest } from "../types";
import { RateLimiter } from "../middleware/rateLimiter";

const router = Router();
const postController = new PostController();

// All routes require authentication
router.use(AuthMiddleware.authenticate);

// Post routes
router.post(
  "/",
  RateLimiter.posting,
  upload.single("image"),
  ValidationMiddleware.validate(postSchema),
  (req: Request, res: Response) => {
    postController.create(req as AuthenticatedRequest, res);
  }
);

router.put(
  "/:postId",
  upload.single("image"),
  ValidationMiddleware.validate(postSchema),
  (req: Request, res: Response) =>
    postController.update(req as AuthenticatedRequest, res)
);

router.get(
  "/",
  ValidationMiddleware.validateQuery(paginationSchema),
  (req: Request, res: Response) => postController.getAllPosts(req, res)
);

router.get(
  "/my-posts",
  ValidationMiddleware.validateQuery(paginationSchema),
  (req: Request, res: Response) =>
    postController.getMyPosts(req as AuthenticatedRequest, res)
);

router.get("/:postId", (req: Request, res: Response) =>
  postController.getPostById(req, res)
);

router.delete("/:postId", (req: Request, res: Response) =>
  postController.deletePost(req as AuthenticatedRequest, res)
);

// Comment routes
router.post(
  "/:postId/comments",
  ValidationMiddleware.validate(commentSchema),
  (req: Request, res: Response) =>
    postController.addComment(req as AuthenticatedRequest, res)
);

router.get("/:postId/comments", (req: Request, res: Response) =>
  postController.getPostComments(req, res)
);

// Reaction routes
router.post("/:postId/reaction", (req: Request, res: Response) =>
  postController.toggleReaction(req as AuthenticatedRequest, res)
);

// Statistics routes
router.get("/:postId/stats", (req: Request, res: Response) =>
  postController.getPostStats(req, res)
);

export default router;
