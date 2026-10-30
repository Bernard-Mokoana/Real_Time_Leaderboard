import { withTransaction } from "../config/db.js";
import { leaderboardEventRepository } from "../repositories/leaderboard-event.repository.js";
import { scoreRepository } from "../repositories/score.repository.js";
import { taskRepository } from "../repositories/task.repository.js";
import type { AwardXpInput, AwardXpResult } from "../types/leaderboard.js";

import { TaskNotFoundError } from "../utils/error.util.js";
export const awardXp = async (input: AwardXpInput): Promise<AwardXpResult> => {
  return withTransaction(async (client) => {
    const task = await taskRepository.findById(client, input.taskId);

    if (!task) {
      throw new TaskNotFoundError(input.taskId);
    }

    const newEvent = await leaderboardEventRepository.createIfAbsent(client, {
      userId: input.userId,
      taskId: task.id,
      xpDelta: task.xpValue,
      eventType: "task_completed",
      referenceId: input.referenceId,
    });

    if (!newEvent) {
      const existingEvent =
        await leaderboardEventRepository.findExistingCompletion(client, {
          userId: input.userId,
          taskId: task.id,
          referenceId: input.referenceId,
        });

      const score = await scoreRepository.findByUserId(client, input.userId);

      if (!existingEvent || !score) {
        throw new Error(
          "A leaderboard event conflict occurred, but the existing record could not be found.",
        );
      }

      return {
        event: existingEvent,
        score,
        wasAlreadyProcessed: true,
      };
    }

    const score = await scoreRepository.addXp(
      client,
      input.userId,
      newEvent.xpDelta,
    );

    return {
      event: newEvent,
      score,
      wasAlreadyProcessed: false,
    };
  });
};
