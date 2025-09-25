import { Request } from "express";

export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  created_at: Date;
  updated_at?: Date;
}

export interface UserProfile extends Omit<User, "password"> {
  post_count: number;
  reaction_count: number;
  comment_count: number;
}

export interface Post {
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

export interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  content: string;
  created_at: Date;
  author_name?: string;
}

export interface Reaction {
  id: number;
  post_id: number;
  user_id: number;
  created_at: Date;
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  posts: T[];
  pagination: {
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface JWTPayload {
  userId: number;
  iat?: number;
  exp?: number;
}

export interface RateLimitInfo {
  limit: number;
  current: number;
  remaining: number;
  resetTime?: number;
}

declare global {
  namespace Express {
    interface Request {
      rateLimit?: RateLimitInfo;
    }
  }
}
