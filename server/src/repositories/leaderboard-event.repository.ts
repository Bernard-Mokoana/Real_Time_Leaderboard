import type {
  LeaderboardEvent,
  LeaderboardEventRow,
} from "../types/leaderboard.js";
import type { DatabaseClient } from "../types/types.js";

const toLeaderboardEvent = (row: LeaderboardEventRow): LeaderboardEvent => ({
  id: row.id,
  userId: row.user_id,
  taskId: row.task_id,
  xpDelta: row.xp_delta,
  eventType: row.event_type,
  referenceId: row.reference_id,
  createdAt: row.created_at,
});

export const leaderboardEventRepository = {
  async createIfAbsent(
    client: DatabaseClient,
    input: {
      userId: string;
      taskId: string;
      xpDelta: number;
      eventType: string;
      referenceId: string;
    },
  ): Promise<LeaderboardEvent | null> {
    const result = await client.query<LeaderboardEventRow>(
      `
            INSERT INTO leaderboard_events (
            user_id, task_id, xp_delta, event_type, reference_id
            )
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (user_id, reference_id)
            WHERE reference_id IS NOT NULL
            DO NOTHING
            RETURNING id, user_id, task_id, xp_delta, event_type, reference_id, created_at
            `,
      [
        input.userId,
        input.taskId,
        input.xpDelta,
        input.eventType,
        input.referenceId,
      ],
    );

    const row = result.rows[0];

    return row ? toLeaderboardEvent(row) : null;
  },

  async findByReferenceId(
    client: DatabaseClient,
    userId: string,
    referenceId: string,
  ): Promise<LeaderboardEvent | null> {
    const result = await client.query<LeaderboardEventRow>(
      `
        SELECT id, user_id, task_id, xp_delta, event_type, reference_id, created_at
        FROM leaderboard_events
        WHERE user_id = $1
        AND reference_id = $2
        `,
      [userId, referenceId],
    );

    const row = result.rows[0];

    return row ? toLeaderboardEvent(row) : null;
  },
};
