import { randomUUID } from "node:crypto";
import type { Redis } from "ioredis";

import { pool } from "../config/db.js";
import { logger } from "../utils/logger.js";
import { encodeRankingScore, MAX_RANKABLE_XP } from "../utils/ranking-score.js";
import {
  GLOBAL_LEADERBOARD_KEY,
  isCacheReadable,
  LEGACY_GLOBAL_LEADERBOARD_KEY,
  markCacheFresh,
  markCacheStale,
} from "./leaderboard-cache.service.js";

import type { RebuildRow } from "../types/types.js";

const REBUILD_BATCH_SIZE = 5_000;
const REBUILD_LOCK_KEY = "leaderboard:rebuild:lock";
const REBUILD_LOCK_SECONDS = 120;

export const rebuildGlobalLeaderboardCache = async (
  redis: Redis,
): Promise<number> => {
  const temporaryKey = `${GLOBAL_LEADERBOARD_KEY}:rebuild:${randomUUID()}`;

  let lastUserId: string | null = null;
  let total = 0;
  let clamped = 0;

  try {
    for (;;) {
      const result: { rows: RebuildRow[] } = await pool.query<RebuildRow>(
        `
        SELECT user_id, total_xp, last_earned
        FROM scores
        WHERE $1::uuid IS NULL OR user_id > $1::uuid
        ORDER BY user_id
        LIMIT $2
        `,
        [lastUserId, REBUILD_BATCH_SIZE],
      );

      if (result.rows.length === 0) {
        break;
      }

      const scoreMembers: (string | number)[] = [];

      for (const row of result.rows) {
        const totalXp = Number(row.total_xp);

        if (totalXp > MAX_RANKABLE_XP) {
          clamped += 1;
        }

        scoreMembers.push(
          encodeRankingScore(totalXp, row.last_earned),
          row.user_id,
        );
      }

      await redis.zadd(temporaryKey, ...scoreMembers);

      total += result.rows.length;
      lastUserId = result.rows[result.rows.length - 1]!.user_id;
    }

    if (total === 0) {
      await redis.del(GLOBAL_LEADERBOARD_KEY);
      logger.info("Leaderboard cache cleared because no scores exist.");
    } else {
      await redis.rename(temporaryKey, GLOBAL_LEADERBOARD_KEY);
    }

    await redis.del(LEGACY_GLOBAL_LEADERBOARD_KEY);

    if (clamped > 0) {
      logger.warn(
        `${clamped} users exceed ${MAX_RANKABLE_XP} XP; their ranking score is clamped.`,
      );
    }

    markCacheFresh();
    logger.success(`Leaderboard cache rebuilt with ${total} users.`);

    return total;
  } catch (error) {
    await redis.del(temporaryKey).catch(() => undefined);
    markCacheStale();
    throw error;
  }
};

export const startCacheMaintenance = (
  redis: Redis,
  options: { staleRetryMs?: number; reconcileMs?: number } = {},
): (() => void) => {
  const staleRetryMs = options.staleRetryMs ?? 30_000;
  const reconcileMs = options.reconcileMs ?? 10 * 60_000;

  let running = false;
  let lastReconcile = Date.now();
  let stopped = false;

  const tick = async (force: boolean): Promise<void> => {
    if (running || stopped) {
      return;
    }

    const dueForReconcile = Date.now() - lastReconcile >= reconcileMs;

    if (!force && !dueForReconcile) {
      return;
    }

    running = true;

    try {
      const gotLock = await redis.set(
        REBUILD_LOCK_KEY,
        "1",
        "EX",
        REBUILD_LOCK_SECONDS,
        "NX",
      );

      if (gotLock === null) {
        return;
      }

      await rebuildGlobalLeaderboardCache(redis);
      lastReconcile = Date.now();
    } catch (error) {
      logger.error("Leaderboard cache maintenance failed.", error);
    } finally {
      running = false;
    }
  };

  const timer = setInterval(() => {
    void tick(false);
  }, 15_000);

  const retryTimer = setInterval(() => {
    if (!isCacheReadable()) {
      void tick(true);
    }
  }, staleRetryMs);

  timer.unref();
  retryTimer.unref();

  return () => {
    stopped = true;
    clearInterval(timer);
    clearInterval(retryTimer);
  };
};
