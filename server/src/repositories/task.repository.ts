import type { DatabaseClient } from "../types/types.js";
import type { Task } from "../types/task.js";
import type { TaskRow } from "../types/task.js";

import { toTask } from "../utils/mappers.js";

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
};
