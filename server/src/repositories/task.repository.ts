import type { DatabaseClient } from "../types/types.js";
import type {
  Task,
  TaskRow,
  TaskWithStatus,
  TaskWithStatusRow,
} from "../types/task.js";

import { toTask, toTaskWithStatus } from "../utils/mappers.js";

const taskWithStatusSelect = `
  SELECT
    tasks.id,
    tasks.title,
    tasks.task_type,
    tasks.xp_value,
    EXISTS (
      SELECT 1
      FROM leaderboard_events
      WHERE leaderboard_events.user_id = $1
        AND leaderboard_events.task_id = tasks.id
        AND leaderboard_events.event_type = 'task_completed'
    ) AS completed
  FROM tasks
`;

export const taskRepository = {
  async findById(client: DatabaseClient, taskId: string): Promise<Task | null> {
    const result = await client.query<TaskRow>(
      `
      SELECT id, title, task_type, xp_value
      FROM tasks
      WHERE id = $1
      `,
      [taskId],
    );

    const row = result.rows[0];

    return row ? toTask(row) : null;
  },

  async findByIdForUser(
    client: DatabaseClient,
    taskId: string,
    userId: string,
  ): Promise<TaskWithStatus | null> {
    const result = await client.query<TaskWithStatusRow>(
      `${taskWithStatusSelect} WHERE tasks.id = $2`,
      [userId, taskId],
    );

    const row = result.rows[0];

    return row ? toTaskWithStatus(row) : null;
  },

  async listForUser(
    client: DatabaseClient,
    input: { userId: string; limit: number; offset: number },
  ): Promise<{ tasks: TaskWithStatus[]; total: number }> {
    const [list, count] = await Promise.all([
      client.query<TaskWithStatusRow>(
        `${taskWithStatusSelect} ORDER BY tasks.created_at, tasks.id LIMIT $2 OFFSET $3`,
        [input.userId, input.limit, input.offset],
      ),
      client.query<{ total: string }>("SELECT COUNT(*) AS total FROM tasks"),
    ]);

    return {
      tasks: list.rows.map(toTaskWithStatus),
      total: Number(count.rows[0]?.total ?? 0),
    };
  },
};
