import type { Pool } from "pg";

import type {
  LeaderboardEntry,
  LeaderboardRow,
  SnapshotRow,
} from "../types/leaderboard.js";

import { toEntry } from "../utils/mappers.js";

const TIE_BREAK_TIME = `COALESCE(date_trunc('second', scores.last_earned), 'infinity'::timestamp)`;

const RANK_ORDER = `scores.total_xp DESC, ${TIE_BREAK_TIME} ASC, scores.user_id DESC`;

export const leaderboardRepository = {
  async findPage(
    pool: Pool,
    input: { offset: number; limit: number },
  ): Promise<LeaderboardEntry[]> {
    const result = await pool.query<LeaderboardRow>(
      `
      SELECT
        users.id AS user_id,
        users.first_name,
        users.last_name,
        users.avatar_url,
        scores.total_xp,
        scores.last_earned
      FROM scores
      INNER JOIN users ON users.id = scores.user_id
      ORDER BY ${RANK_ORDER}
      LIMIT $1 OFFSET $2
      `,
      [input.limit, input.offset],
    );

    return result.rows.map((row, index) =>
      toEntry(row, input.offset + index + 1),
    );
  },

  async findRank(pool: Pool, userId: string): Promise<{ rank: number } | null> {
    const result = await pool.query<{ rank: string }>(
      `
      WITH me AS (
        SELECT
          total_xp,
          COALESCE(date_trunc('second', last_earned), 'infinity'::timestamp) AS tie_time,
          user_id
        FROM scores
        WHERE user_id = $1
      )
      SELECT
        (
          SELECT COUNT(*)
          FROM scores
          CROSS JOIN me
          WHERE scores.total_xp > me.total_xp
             OR (
               scores.total_xp = me.total_xp
               AND (
                 ${TIE_BREAK_TIME} < me.tie_time
                 OR (${TIE_BREAK_TIME} = me.tie_time AND scores.user_id > me.user_id)
               )
             )
        ) + 1 AS rank
      FROM me
      `,
      [userId],
    );

    const row = result.rows[0];

    return row ? { rank: Number(row.rank) } : null;
  },

  async findProfiles(
    pool: Pool,
    userIds: readonly string[],
  ): Promise<Map<string, LeaderboardRow>> {
    if (userIds.length === 0) {
      return new Map();
    }

    const result = await pool.query<LeaderboardRow>(
      `
      SELECT
        users.id AS user_id,
        users.first_name,
        users.last_name,
        users.avatar_url,
        scores.total_xp,
        scores.last_earned
      FROM users
      LEFT JOIN scores ON scores.user_id = users.id
      WHERE users.id = ANY($1::uuid[])
      `,
      [userIds],
    );

    return new Map(result.rows.map((row) => [row.user_id, row]));
  },

  async findSnapshotPage(
    pool: Pool,
    input: {
      timeframe: string;
      periodKey: string;
      offset: number;
      limit: number;
    },
  ): Promise<LeaderboardEntry[]> {
    const result = await pool.query<SnapshotRow>(
      `
      SELECT
        users.id AS user_id,
        users.first_name,
        users.last_name,
        users.avatar_url,
        leaderboard_snapshots.xp_earned,
        leaderboard_snapshots.final_rank
      FROM leaderboard_snapshots
      INNER JOIN users ON users.id = leaderboard_snapshots.user_id
      WHERE leaderboard_snapshots.timeframe = $1
        AND leaderboard_snapshots.period_key = $2
      ORDER BY leaderboard_snapshots.final_rank ASC
      LIMIT $3 OFFSET $4
      `,
      [input.timeframe, input.periodKey, input.limit, input.offset],
    );

    return result.rows.map((row) => ({
      rank: row.final_rank,
      userId: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
      avatarUrl: row.avatar_url,
      totalXp: Number(row.xp_earned),
      lastEarned: null,
    }));
  },
};
