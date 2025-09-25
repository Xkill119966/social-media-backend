import database from "../config/database";

interface PostRow {
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

export class Post {
  public id: number;
  public user_id: number;
  public title: string;
  public content: string;
  public image?: string;
  public created_at: Date;
  public updated_at?: Date;

  constructor(data: PostRow) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.title = data.title;
    this.content = data.content;
    this.image = data.image;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async create(postData: {
    user_id: number;
    title: string;
    content: string;
    image?: string;
  }): Promise<PostRow> {
    const query = `
      INSERT INTO posts (user_id, title, content, image) 
      VALUES (?, ?, ?, ?)
    `;

    const result = await database.query<{ insertId: number }>(query, [
      postData.user_id,
      postData.title,
      postData.content,
      postData.image || null,
    ]);

    const post = await Post.findById((result as any).insertId);
    if (!post) {
      throw new Error("Failed to create post");
    }

    return post;
  }

  static async findById(id: number): Promise<PostRow | null> {
    const query = `
      SELECT 
        p.*,
        u.name as author_name,
        COUNT(DISTINCT r.id) as reaction_count,
        COUNT(DISTINCT c.id) as comment_count
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN reactions r ON p.id = r.post_id
      LEFT JOIN comments c ON p.id = c.post_id
      WHERE p.id = ?
      GROUP BY p.id
    `;

    const rows = await database.query<PostRow>(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  static async findAll(
    page: number = 1,
    limit: number = 10,
    userId: number
  ): Promise<PostRow[]> {
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        p.id,
        p.title,
        p.content,
        p.image,
        p.created_at,
        u.id as author_id,
        u.name as author_name,
        COUNT(DISTINCT r.id) as reaction_count,
        COUNT(DISTINCT c.id) as comment_count,
        CASE 
          WHEN EXISTS (
            SELECT 1 
            FROM reactions rr 
            WHERE rr.post_id = p.id AND rr.user_id = ?
          ) THEN 1
          ELSE 0
        END AS user_has_liked
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN reactions r ON p.id = r.post_id
      LEFT JOIN comments c ON p.id = c.post_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    return await database.query<PostRow>(query, [userId, limit, offset]);
  }

  static async findByUserId(
    userId: number,
    page: number = 1,
    limit: number = 10
  ): Promise<PostRow[]> {
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        p.*,
        COUNT(DISTINCT r.id) as reaction_count,
        COUNT(DISTINCT c.id) as comment_count
      FROM posts p
      LEFT JOIN reactions r ON p.id = r.post_id
      LEFT JOIN comments c ON p.id = c.post_id
      WHERE p.user_id = ?
      GROUP BY p.id, p.user_id, p.title, p.content, p.image, p.created_at, p.updated_at
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `;

    // Ensure all parameters are properly converted to numbers
    const params = [userId, limit, offset];

    return await database.query<PostRow>(query, params);
  }

  static async update(
    id: number,
    userId: number,
    updateData: { title: string; content: string; image?: string }
  ): Promise<PostRow | null> {
    const query = `
      UPDATE posts 
      SET title = ?, content = ?, image = ?
      WHERE id = ? AND user_id = ?
    `;

    await database.query(query, [
      updateData.title,
      updateData.content,
      updateData.image || null,
      id,
      userId,
    ]);

    return await Post.findById(id);
  }

  static async delete(id: number, userId: number): Promise<boolean> {
    const query = "DELETE FROM posts WHERE id = ? AND user_id = ?";
    const result = await database.query<{ affectedRows: number }>(query, [
      id,
      userId,
    ]);

    return (result as any).affectedRows > 0;
  }
}
