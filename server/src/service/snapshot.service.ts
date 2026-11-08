import { withTransaction } from "../config/db.js";
import { getRealtimeServer } from "../config/runtime.js";
import {
  closedPeriodKey,
  periodBounds,
  SNAPSHOT_TIMEFRAMES,
} from "../utils/period.js";
import { logger } from "../utils/logger.js";

import type { CaptureResult, SnapshotTimeframe } from "../types/types.js";

export const captureSnapshot = async (
  timeframe: SnapshotTimeframe,
  periodKey: string,
): Promise<CaptureResult> => {
  const bounds = periodBounds(timeframe, periodKey);

  if (!bounds) {
    throw new RangeError(
      `"${periodKey}" is not a valid ${timeframe} period key.`,
    );
  }

  return withTransaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
      `snapshot:${timeframe}:${periodKey}`,
    ]);

    const existing = await client.query(
      `
      SELECT 1
      FROM leaderboard_snapshots
      WHERE timeframe = $1 AND period_key = $2
      LIMIT 1
      `,
      [timeframe, periodKey],
    );

    if (existing.rowCount && existing.rowCount > 0) {
      return { inserted: 0, alreadyCaptured: true };
    }

    const result = await client.query(
      `
      INSERT INTO leaderboard_snapshots (user_id, timeframe, period_key, xp_earned, final_rank)
      SELECT
        earned.user_id,
        $1,
        $2,
        earned.xp,
        ROW_NUMBER() OVER (
          ORDER BY earned.xp DESC, earned.last_at ASC, earned.user_id DESC
        )
      FROM (
        SELECT
          user_id,
          SUM(xp_delta)::bigint AS xp,
          date_trunc('second', MAX(created_at)) AS last_at
        FROM leaderboard_events
        WHERE created_at >= $3::timestamp AND created_at < $4::timestamp
        GROUP BY user_id
        HAVING SUM(xp_delta) > 0
      ) AS earned
      ON CONFLICT (user_id, timeframe, period_key) DO NOTHING
      `,
      [
        timeframe,
        periodKey,
        bounds.start.toISOString(),
        bounds.end.toISOString(),
      ],
    );

    return { inserted: result.rowCount ?? 0, alreadyCaptured: false };
  });
};

const LOOKBACK_PERIODS = 3;

const captureRecentPeriods = async (now: Date): Promise<void> => {
  for (const timeframe of SNAPSHOT_TIMEFRAMES) {
    for (let stepsBack = LOOKBACK_PERIODS - 1; stepsBack >= 0; stepsBack -= 1) {
      const periodKey = closedPeriodKey(timeframe, now, stepsBack);

      try {
        const result = await captureSnapshot(timeframe, periodKey);

        if (result.inserted > 0) {
          logger.success(
            `Captured ${timeframe} snapshot ${periodKey} for ${result.inserted} users.`,
          );

          getRealtimeServer()?.emit("leaderboard:snapshot", {
            timeframe,
            periodKey,
            capturedAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        logger.error(
          `Snapshot capture failed for ${timeframe} ${periodKey}.`,
          error,
        );
      }
    }
  }
};

export const startSnapshotScheduler = (
  intervalMs = 5 * 60_000,
): (() => void) => {
  let running = false;

  const run = async (): Promise<void> => {
    if (running) {
      return;
    }

    running = true;

    try {
      await captureRecentPeriods(new Date());
    } finally {
      running = false;
    }
  };

  void run();

  const timer = setInterval(() => {
    void run();
  }, intervalMs);

  timer.unref();

  return () => clearInterval(timer);
};
