import database from "../config/database";

interface CommentRow {
  id: number;
  post_id: number;
  user_id: number;
  content: string;
  created_at: Date;
  author_name?: string;
}

export class Comment {
  public id: number;
  public post_id: number;
  public user_id: number;
  public content: string;
  public created_at: Date;

  constructor(data: CommentRow) {
    this.id = data.id;
    this.post_id = data.post_id;
    this.user_id = data.user_id;
    this.content = data.content;
    this.created_at = data.created_at;
  }

  static async create(commentData: {
    post_id: number;
    user_id: number;
    content: string;
  }): Promise<CommentRow> {
    const query = `
      INSERT INTO comments (post_id, user_id, content) 
      VALUES (?, ?, ?)
    `;

    const result = await database.query<{ insertId: number }>(query, [
      commentData.post_id,
      commentData.user_id,
      commentData.content,
    ]);

    const comment = await Comment.findById((result as any).insertId);
    if (!comment) {
      throw new Error("Failed to create comment");
    }

    return comment;
  }

  static async findById(id: number): Promise<CommentRow | null> {
    const query = `
      SELECT 
        c.*,
        u.name as author_name
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `;

    const rows = await database.query<CommentRow>(query, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  static async findByPostId(postId: number): Promise<CommentRow[]> {
    const query = `
      SELECT 
        c.*,
        u.name as author_name
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `;

    return await database.query<CommentRow>(query, [postId]);
  }
}
