import database from "../config/database";

interface ReactionRow {
  id: number;
  post_id: number;
  user_id: number;
  created_at: Date;
}

interface ReactionResult {
  action: "added" | "removed";
  count: number;
}

export class Reaction {
  public id: number;
  public post_id: number;
  public user_id: number;
  public created_at: Date;

  constructor(data: ReactionRow) {
    this.id = data.id;
    this.post_id = data.post_id;
    this.user_id = data.user_id;
    this.created_at = data.created_at;
  }

  static async toggle(postId: number, userId: number): Promise<ReactionResult> {
    // Check if reaction already exists
    const existingQuery = `
      SELECT * FROM reactions 
      WHERE post_id = ? AND user_id = ?
    `;

    const existing = await database.query<ReactionRow>(existingQuery, [
      postId,
      userId,
    ]);

    if (existing.length > 0) {
      // Remove existing reaction
      const deleteQuery = `
        DELETE FROM reactions 
        WHERE post_id = ? AND user_id = ?
      `;

      await database.query(deleteQuery, [postId, userId]);

      return {
        action: "removed",
        count: await Reaction.getCount(postId),
      };
    } else {
      // Add new reaction
      const insertQuery = `
        INSERT INTO reactions (post_id, user_id) 
        VALUES (?, ?)
      `;

      await database.query(insertQuery, [postId, userId]);

      return {
        action: "added",
        count: await Reaction.getCount(postId),
      };
    }
  }

  static async getCount(postId: number): Promise<number> {
    const query = `
      SELECT COUNT(*) as count 
      FROM reactions 
      WHERE post_id = ?
    `;

    const rows = await database.query<{ count: number }>(query, [postId]);
    return rows[0].count;
  }

  static async getUserReaction(
    postId: number,
    userId: number
  ): Promise<Reaction | null> {
    const query = `
      SELECT * FROM reactions 
      WHERE post_id = ? AND user_id = ?
    `;

    const rows = await database.query<ReactionRow>(query, [postId, userId]);
    return rows.length > 0 ? new Reaction(rows[0]) : null;
  }
}
