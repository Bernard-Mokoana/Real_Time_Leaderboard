import { randomUUID } from "node:crypto";
import type { Redis } from "ioredis";

import { pool } from "../config/db.js";
import { logger } from "../utils/logger.js";
import { GLOBAL_LEADERBOARD_KEY } from "./leaderboard-cache.service.js";
import type { ScoreCachedRow } from "../types/score.js";
import { error } from "node:console";

export const rebuildGlobalLeaderboardCache = async (
  redis: Redis,
): Promise<void> => {
  const result = await pool.query<ScoreCachedRow>(
    `
        SELECT user_id, total_xp
        FROM scores
        `,
  );

  if (result.rows.length === 0) {
    await redis.del(GLOBAL_LEADERBOARD_KEY);
    logger.info("Leaderboard cache cleared because no scores exist.");
    return;
  }

  const temporaryKey = `${GLOBAL_LEADERBOARD_KEY}:rebuild:${randomUUID()}`;

  const pipeline = redis.pipeline();

  for (const row of result.rows) {
    pipeline.zadd(temporaryKey, Number(row.total_xp), row.user_id);
  }

  const pipelineResults = await pipeline.exec();

  const failedCommand = pipelineResults?.find(([error]) => error !== null);

  if (failedCommand?.[0]) {
    await redis.del(temporaryKey);
    throw failedCommand[0];
  }

  // Atomic key replacement: readers see either the old or new set.
  // never a partly rebuilt leaderboard
  await redis.rename(temporaryKey, GLOBAL_LEADERBOARD_KEY);

  logger.success(`Leaderboard cache rebuilt with ${result.rows.length} users.`);
};
