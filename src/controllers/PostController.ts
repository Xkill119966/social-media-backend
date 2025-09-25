import { Request, Response } from "express";
import {
  PostService,
  CreatePostData,
  UpdatePostData,
} from "../services/PostService";
import { AuthenticatedRequest } from "../types";
import { PostInput, CommentInput } from "../schemas/validation";
import { BaseController } from "./BaseController";

export class PostController extends BaseController {
  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { title, content }: PostInput = req.body;
      let imageUrl = "";
      if (req.file) {
        const uploadPath = process.env.UPLOAD_PATH || "uploads";
        imageUrl = `/${uploadPath}/${req.file.filename}`;
      }

      const postData: CreatePostData = {
        userId: req.user!.id,
        title,
        content,
        image: imageUrl || undefined,
      };

      const post = await PostService.createPost(postData);

      this.sendCreated(res, post, "Post created successfully");
    } catch (error) {
      this.handleServiceError(error as Error, res, "Post creation");
    }
  }

  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const postId = this.extractNumericId(req, "postId", res);
      if (postId === null) return;

      const { title, content }: PostInput = req.body;

      // Handle image upload for updates
      let imageUrl = "";
      if (req.file) {
        const uploadPath = process.env.UPLOAD_PATH || "uploads";
        imageUrl = `/${uploadPath}/${req.file.filename}`;
      }

      const updateData: UpdatePostData = {
        title,
        content,
        image: imageUrl || undefined,
      };

      const post = await PostService.updatePost(
        postId,
        req.user!.id,
        updateData
      );

      this.sendSuccess(res, post, "Post updated successfully");
    } catch (error) {
      this.handleServiceError(error as Error, res, "Post update");
    }
  }

  async getMyPosts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(
        100,
        Math.max(1, parseInt(req.query.limit as string) || 10)
      );

      const result = await PostService.getUserPosts(req.user!.id, {
        page,
        limit,
      });

      this.sendSuccess(
        res,
        {
          items: result.posts,
          pagination: result.pagination,
        },
        "Posts retrieved successfully"
      );
    } catch (error) {
      this.handleServiceError(error as Error, res, "Get user posts");
    }
  }

  async getAllPosts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(
        100,
        Math.max(1, parseInt(req.query.limit as string) || 10)
      );

      const result = await PostService.getAllPosts(
        { page, limit },
        req.user?.id as number
      );

      this.sendSuccess(
        res,
        {
          items: result.posts,
          pagination: result.pagination,
        },
        "Posts retrieved successfully"
      );
    } catch (error) {
      this.handleServiceError(error as Error, res, "Get all posts");
    }
  }

  async getPostById(req: Request, res: Response): Promise<void> {
    try {
      const postId = this.extractNumericId(req, "postId", res);
      if (postId === null) return;

      const post = await PostService.getPostById(postId);

      this.sendSuccess(res, post, "Post retrieved successfully");
    } catch (error) {
      this.handleServiceError(error as Error, res, "Get post");
    }
  }

  async deletePost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const postId = this.extractNumericId(req, "postId", res);
      if (postId === null) return;

      await PostService.deletePost(postId, req.user!.id);

      this.sendSuccess(res, undefined, "Post deleted successfully");
    } catch (error) {
      this.handleServiceError(error as Error, res, "Post deletion");
    }
  }

  async addComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const postId = this.extractNumericId(req, "postId", res);
      if (postId === null) return;

      const commentData: CommentInput = req.body;

      const comment = await PostService.addComment(
        postId,
        req.user!.id,
        commentData
      );

      this.sendCreated(res, comment, "Comment added successfully");
    } catch (error) {
      this.handleServiceError(error as Error, res, "Add comment");
    }
  }

  async getPostComments(req: Request, res: Response): Promise<void> {
    try {
      const postId = this.extractNumericId(req, "postId", res);
      if (postId === null) return;

      const comments = await PostService.getPostComments(postId);

      this.sendSuccess(res, comments, "Comments retrieved successfully");
    } catch (error) {
      this.handleServiceError(error as Error, res, "Get comments");
    }
  }

  async toggleReaction(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> {
    try {
      const postId = this.extractNumericId(req, "postId", res);
      if (postId === null) return;

      const result = await PostService.toggleReaction(postId, req.user!.id);

      this.sendSuccess(
        res,
        {
          action: result.action,
          reaction_count: result.reaction_count,
        },
        `Reaction ${result.action}`
      );
    } catch (error) {
      this.handleServiceError(error as Error, res, "Toggle reaction");
    }
  }

  async getPostStats(req: Request, res: Response): Promise<void> {
    try {
      const postId = this.extractNumericId(req, "postId", res);
      if (postId === null) return;

      const stats = await PostService.getPostStats(postId);

      this.sendSuccess(res, stats, "Post statistics retrieved successfully");
    } catch (error) {
      this.handleServiceError(error as Error, res, "Get post stats");
    }
  }
}
