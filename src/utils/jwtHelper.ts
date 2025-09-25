import jwt, { SignOptions } from "jsonwebtoken";

export interface JWTPayload {
  userId: number;
  iat?: number;
  exp?: number;
}

const TOKEN_CONFIG = {
  access: "1d",
} as const;

type TokenType = keyof typeof TOKEN_CONFIG;

export class JWTHelper {
  private static readonly JWT_SECRET =
    (process.env.JWT_SECRET as string) || "default-secrect-string";

  /**
   * Generate JWT token
   */
  static generateToken(
    userId: number,
    type: TokenType,
    expiresIn?: string
  ): string {
    const options: SignOptions = {
      expiresIn: expiresIn ?? (TOKEN_CONFIG[type] as any),
    };

    return jwt.sign(
      {
        userId: userId,
        type,
      },
      this.JWT_SECRET,
      options
    );
  }

  /**
   * Verify JWT token and return payload
   */
  static verifyToken(token: string): JWTPayload {
    if (!this.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    try {
      return jwt.verify(token, this.JWT_SECRET) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error("INVALID_TOKEN");
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error("TOKEN_EXPIRED");
      }
      throw error;
    }
  }

  static getTokenExpiration(token: string): number {
    try {
      const decoded = this.verifyToken(token);
      return decoded.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 0;
    } catch {
      return 0;
    }
  }
}
