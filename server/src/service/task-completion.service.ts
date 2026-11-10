import { pool } from "../config/db.js";
import { taskRepository } from "../repositories/task.repository.js";
import { TaskNotFoundError } from "../utils/error.util.js";
import { scoreTaskQuiz } from "./task-quiz.service.js";
import { getRealtimeServer, getRedis } from "../config/runtime.js";
import { GLOBAL_LEADERBOARD_ROOM } from "../realtime/socket.js";
import type { AwardXpInput, CompleteTaskResult } from "../types/leaderboard.js";
import type { QuizAnswer } from "../types/task.js";
import { logger } from "../utils/logger.js";
import { awardXp } from "./award-xp.service.js";
import {
  getCachedRank,
  isCacheReadable,
  markCacheStale,
  upsertCachedScore,
} from "./leaderboard-cache.service.js";

export const completeTask = async (
  input: AwardXpInput & { answers: QuizAnswer[] },
): Promise<CompleteTaskResult> => {
  const task = await taskRepository.findById(pool, input.taskId);

  if (!task) {
    throw new TaskNotFoundError(input.taskId);
  }

  const correctAnswers = scoreTaskQuiz(input.answers);
  const xpDelta = Math.floor((task.xpValue * correctAnswers) / 5);

  const result = await awardXp({
    userId: input.userId,
    taskId: input.taskId,
    referenceId: input.referenceId,
    xpDelta,
  });

  const redis = getRedis();
  let rank: number | null = null;

  if (redis && isCacheReadable()) {
    try {
      if (!result.wasAlreadyProcessed) {
        await upsertCachedScore(redis, {
          userId: result.score.userId,
          totalXp: result.score.totalXp,
          lastEarned: result.score.lastEarned,
        });
      }

      rank = await getCachedRank(redis, result.score.userId);
    } catch (error) {
      markCacheStale();
      logger.error("Unable to update the Redis leaderboard cache.", error);
    }
  }

  if (!result.wasAlreadyProcessed) {
    getRealtimeServer()
      ?.to(GLOBAL_LEADERBOARD_ROOM)
      .emit("leaderboard:updated", {
        userId: result.event.userId,
        xpDelta: result.event.xpDelta,
        totalXp: result.score.totalXp,
        rank,
        occurredAt: result.event.createdAt.toISOString(),
      });
  }

  return { ...result, rank };
};
