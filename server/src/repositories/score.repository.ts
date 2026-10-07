import type { PoolClient } from "pg";
import type { Score, ScoreRow } from "../types/score.js";
import type { DatabaseClient } from "../types/types.js";

const toScore = (row: ScoreRow): Score => ({
  userId: row.user_id,
  totalXp: Number(row.total_xp),
  lastEarned: row.last_earned,
});

export const scoreRepository = {
  async addXp(
    client: DatabaseClient,
    userId: string,
    xpDelta: number,
  ): Promise<Score> {
    const result = await client.query<ScoreRow>(
      `
            INSERT INTO scores (user_id, total_xp, last_earned)
            VALUES ($1, $2, NOW())
            ON CONFLICT (user_id)
            DO UPDATE
            SET
               total_xp = scores.total_xp + EXCLUDED.total_xp,
               last_earned = NOW()
            RETURNING user_id, total_xp, last_earned
            `,
      [userId, xpDelta],
    );

    return toScore(result.rows[0]!);
  },

  async createInitialScore(
    client: DatabaseClient,
    userId: string,
  ): Promise<void> {
    await client.query(
      `
        INSERT INTO scores (user_id, total_xp)
        VALUES ($1, 0)
        `,
      [userId],
    );
  },

  async findByUserId(
    client: DatabaseClient,
    userId: string,
  ): Promise<Score | null> {
    const result = await client.query<ScoreRow>(
      `
        SELECT user_id, total_xp, last_earned
        FROM scores
        WHERE user_id = $1
        `,
      [userId],
    );

    const row = result.rows[0];

    return row ? toScore(row) : null;
  },
};
