import type { Pool } from "pg";

import type {
  LeaderboardCursor,
  LeaderboardEntry,
  LeaderboardRow,
} from "../types/leaderboard.js";

const toLeaderboardEntry = (row: LeaderboardRow): LeaderboardEntry => ({
  rank: Number(row.rank),
  userId: row.user_id,
  firstName: row.first_name,
  lastName: row.last_name,
  avatarUrl: row.avatar_url,
  totalXp: Number(row.total_xp),
  lastEarned: row.last_earned,
});

export const leaderboardRepository = {
  async findPage(
    pool: Pool,
    input: { limit: number; cursor: LeaderboardCursor | null },
  ): Promise<LeaderboardEntry[]> {
    const result = await pool.query<LeaderboardRow>(
      `
            WITH ranked_scores AS (
            SELECT RANK() OVER (
            ORDER BY scores.total_xp DESC
            ) AS rank,
             users.id AS user_id,
             users.first_name,

             users.last_name,
             users.avatar_url,
             scores.total_xp,
             scores.last_earned
            FROM scores
            INNER JOIN users
               ON users.id = scores.user_id
            )
            SELECT 
              rank,
              user_id,
              first_name,
              last_name,
              avatar_url,
              total_xp,
              last_earned
            FROM ranked_scores
            WHERE 
               $1::bigint IS NULL
               OR total_xp < $1::bigint
               OR (
                  total_xp = $1::bigint
                  AND user_id > $2::uuid
               )
            ORDER BY
               total_xp DESC,
               user_id ASC
            LIMIT $3
            `,
      [
        input.cursor?.totalXp ?? null,
        input.cursor?.userId ?? null,
        input.limit,
      ],
    );

    return result.rows.map(toLeaderboardEntry);
  },

  async findByUserId(
    pool: Pool,
    userId: string,
  ): Promise<LeaderboardEntry | null> {
    const result = await pool.query<LeaderboardRow>(
      `
        WITH ranked_scores AS (
          SELECT RANK() OVER (
                   ORDER BY scores.total_xp DESC
          ) AS rank,
           users.id AS user_id,
           users.first_name,
           users.last_name,
           users.avatar_url,
           scores.total_xp,
           scores.last_earned
          FROM scores
          INNER JOIN users
             ON users.id = scores.user_id
        )
          SELECT rank, user_id, first_name, last_name, avatar_url, total_xp, last_earned
          FROM ranked_scores
          WHERE user_id = $1
        `,
      [userId],
    );

    const row = result.rows[0];

    return row ? toLeaderboardEntry(row) : null;
  },
};
