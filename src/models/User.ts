import bcrypt from "bcryptjs";
import database from "../config/database";
import { User as UserType, UserProfile } from "../types";
import { PasswordHelper } from "../utils/passwordHelper";
interface UserRow {
  id: number;
  name: string;
  email: string;
  password: string;
  created_at: Date;
  updated_at?: Date;
}

interface UserProfileRow extends UserRow {
  post_count: number;
  reaction_count: number;
  comment_count: number;
}

export class User {
  public id: number;
  public name: string;
  public email: string;
  public password?: string;
  public created_at: Date;
  public updated_at?: Date;

  constructor(data: UserRow) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.password = data.password;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async create(userData: {
    name: string;
    email: string;
    password: string;
  }): Promise<User> {
    const hashedPassword = await PasswordHelper.hashPassword(userData.password);

    const query = `
      INSERT INTO users (name, email, password) 
      VALUES (?, ?, ?)
    `;

    const result = await database.query<{ insertId: number }>(query, [
      userData.name,
      userData.email,
      hashedPassword,
    ]);

    const user = await User.findById((result as any).insertId);
    if (!user) {
      throw new Error("Failed to create user");
    }

    return user;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const query = "SELECT * FROM users WHERE email = ?";
    const rows = await database.query<UserRow>(query, [email]);

    return rows.length > 0 ? new User(rows[0]) : null;
  }

  static async findById(id: number): Promise<User | null> {
    const query = "SELECT * FROM users WHERE id = ?";
    const rows = await database.query<UserRow>(query, [id]);

    return rows.length > 0 ? new User(rows[0]) : null;
  }

  static async getProfile(userId: number): Promise<UserProfile | null> {
    const query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.created_at,
        COUNT(DISTINCT p.id) as post_count,
        COUNT(DISTINCT r.id) as reaction_count,
        COUNT(DISTINCT c.id) as comment_count
      FROM users u
      LEFT JOIN posts p ON u.id = p.user_id
      LEFT JOIN reactions r ON u.id = r.user_id
      LEFT JOIN comments c ON u.id = c.user_id
      WHERE u.id = ?
      GROUP BY u.id
    `;

    const rows = await database.query<UserProfileRow>(query, [userId]);
    return rows.length > 0 ? rows[0] : null;
  }

  async comparePassword(password: string): Promise<boolean> {
    if (!this.password) {
      return false;
    }
    return await bcrypt.compare(password, this.password);
  }

  toJSON(): Omit<UserType, "password"> {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}
