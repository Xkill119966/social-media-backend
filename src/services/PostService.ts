import { Post } from "../models/Post";
import { Comment } from "../models/Comment";
import { Reaction } from "../models/Reaction";
import {
  PostInput,
  CommentInput,
  PaginationInput,
} from "../schemas/validation";
import { Comment as CommentType, PaginatedResponse } from "../types";
import { BaseService } from "./BaseService";

export interface CreatePostData {
  userId: number;
  title: string;
  content: string;
  image?: string;
}

export interface UpdatePostData {
  title: string;
  content: string;
  image?: string;
}

export interface PostWithDetails {
  id: number;
  user_id: number;
  title: string;
  content: string;
  image?: string;
  created_at: Date;
  updated_at?: Date;
  author_name?: string;
  author_id?: number;
  reaction_count?: number;
  comment_count?: number;
}

export interface ReactionResult {
  action: "added" | "removed";
  reaction_count: number;
}

export class PostService extends BaseService {
  /**
   * Create a new post
   */
  static async createPost(postData: CreatePostData): Promise<PostWithDetails> {
    const { userId, title, content, image } = postData;

    // Validate user exists (this could be done in middleware, but adding here for service completeness)
    if (!userId || userId <= 0) {
      throw new Error("INVALID_USER_ID");
    }

    // Create the post
    const post = await Post.create({
      user_id: userId,
      title,
      content,
      image,
    });

    return post;
  }

  /**
   * Update an existing post
   */
  static async updatePost(
    postId: number,
    userId: number,
    updateData: UpdatePostData
  ): Promise<PostWithDetails> {
    // Validate post exists and user owns it
    const existingPost = await Post.findById(postId);
    if (!existingPost) {
      throw new Error("POST_NOT_FOUND");
    }

    if (existingPost.user_id !== userId) {
      throw new Error("UNAUTHORIZED_POST_ACCESS");
    }

    // Update the post
    const updatedPost = await Post.update(postId, userId, updateData);
    if (!updatedPost) {
      throw new Error("POST_UPDATE_FAILED");
    }

    return updatedPost;
  }

  /**
   * Get a single post by ID
   */
  static async getPostById(postId: number): Promise<PostWithDetails> {
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error("POST_NOT_FOUND");
    }

    return post;
  }

  /**
   * Get all posts with pagination (newsfeed)
   */
  static async getAllPosts(
    pagination: PaginationInput,
    userId: number
  ): Promise<PaginatedResponse<PostWithDetails>> {
    const { page, limit } = pagination;
    const posts = await Post.findAll(page, limit, userId);

    return {
      posts,
      pagination: {
        page,
        limit,
        hasMore: posts.length === limit,
      },
    };
  }

  /**
   * Get posts by user ID with pagination
   */
  static async getUserPosts(
    userId: number,
    pagination: PaginationInput
  ): Promise<PaginatedResponse<PostWithDetails>> {
    const { page, limit } = pagination;
    const posts = await Post.findByUserId(userId, page, limit);

    return {
      posts,
      pagination: {
        page,
        limit,
        hasMore: posts.length === limit,
      },
    };
  }

  /**
   * Delete a post
   */
  static async deletePost(postId: number, userId: number): Promise<void> {
    // Validate post exists and user owns it
    const existingPost = await Post.findById(postId);
    if (!existingPost) {
      throw new Error("POST_NOT_FOUND");
    }

    if (existingPost.user_id !== userId) {
      throw new Error("UNAUTHORIZED_POST_ACCESS");
    }

    // Delete the post
    const deleted = await Post.delete(postId, userId);
    if (!deleted) {
      throw new Error("POST_DELETE_FAILED");
    }
  }

  /**
   * Add a comment to a post
   */
  static async addComment(
    postId: number,
    userId: number,
    commentData: CommentInput
  ): Promise<CommentType> {
    // Validate post exists
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error("POST_NOT_FOUND");
    }

    // Create the comment
    const comment = await Comment.create({
      post_id: postId,
      user_id: userId,
      content: commentData.content,
    });

    return comment;
  }

  /**
   * Get comments for a post
   */
  static async getPostComments(postId: number): Promise<CommentType[]> {
    // Validate post exists
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error("POST_NOT_FOUND");
    }

    return await Comment.findByPostId(postId);
  }

  /**
   * Toggle reaction on a post (like/unlike)
   */
  static async toggleReaction(
    postId: number,
    userId: number
  ): Promise<ReactionResult> {
    // Validate post exists
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error("POST_NOT_FOUND");
    }

    // Toggle the reaction
    const result = await Reaction.toggle(postId, userId);

    return {
      action: result.action,
      reaction_count: result.count,
    };
  }

  /**
   * Get user's reaction on a post
   */
  static async getUserReaction(postId: number, userId: number): Promise<any> {
    return await Reaction.getUserReaction(postId, userId);
  }

  /**
   * Get reaction count for a post
   */
  static async getReactionCount(postId: number): Promise<number> {
    return await Reaction.getCount(postId);
  }

  /**
   * Search posts by title or content
   */
  static async searchPosts(
    query: string,
    pagination: PaginationInput
  ): Promise<PaginatedResponse<PostWithDetails>> {
    // This would require implementing search in the Post model
    // For now, we'll throw an error indicating it's not implemented
    throw new Error("SEARCH_NOT_IMPLEMENTED");
  }

  /**
   * Get trending posts (most reactions in last 24 hours)
   */
  static async getTrendingPosts(
    pagination: PaginationInput
  ): Promise<PaginatedResponse<PostWithDetails>> {
    // This would require implementing trending logic in the Post model
    // For now, we'll throw an error indicating it's not implemented
    throw new Error("TRENDING_NOT_IMPLEMENTED");
  }

  /**
   * Get post statistics
   */
  static async getPostStats(postId: number): Promise<{
    reactions: number;
    comments: number;
    views?: number;
  }> {
    const post = await Post.findById(postId);
    if (!post) {
      throw new Error("POST_NOT_FOUND");
    }

    return {
      reactions: post.reaction_count || 0,
      comments: post.comment_count || 0,
      views: 0, // Would need to implement view tracking
    };
  }

  /**
   * Validate post ownership
   */
  static async validatePostOwnership(
    postId: number,
    userId: number
  ): Promise<boolean> {
    const post = await Post.findById(postId);
    if (!post) {
      return false;
    }

    return post.user_id === userId;
  }

  /**
   * Get recent posts by user
   */
  static async getRecentUserPosts(
    userId: number,
    limit: number = 5
  ): Promise<PostWithDetails[]> {
    return await Post.findByUserId(userId, 1, limit);
  }

  /**
   * Validate post content
   */
  static validatePostContent(
    title: string,
    content: string
  ): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!title || title.trim().length === 0) {
      errors.push("Title is required");
    }

    if (title && title.length > 255) {
      errors.push("Title must be less than 255 characters");
    }

    if (!content || content.trim().length === 0) {
      errors.push("Content is required");
    }

    if (content && content.length > 10000) {
      errors.push("Content must be less than 10,000 characters");
    }

    // Check for spam patterns
    if (
      this.containsSpamPatterns(title) ||
      this.containsSpamPatterns(content)
    ) {
      errors.push("Content appears to be spam");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check for spam patterns in content
   */
  private static containsSpamPatterns(text: string): boolean {
    const spamPatterns = [
      /(.)\1{10,}/g, // Repeated characters
      /https?:\/\/[^\s]+/g, // Multiple URLs (basic check)
      /\b(buy now|click here|free money|get rich|make money fast)\b/gi,
    ];

    return spamPatterns.some((pattern) => pattern.test(text));
  }

  /**
   * Get post engagement rate
   */
  static calculateEngagementRate(post: PostWithDetails): number {
    const reactions = post.reaction_count || 0;
    const comments = post.comment_count || 0;

    // Simple engagement calculation (would be more complex with views)
    return reactions + comments * 2; // Comments weighted more than reactions
  }
}
