import type { Redis } from "ioredis";

import type { CachedLeaderboardEntry } from "../types/leaderboard.js";
import { decodeTotalXp, encodeRankingScore } from "../utils/ranking-score.js";

export const GLOBAL_LEADERBOARD_KEY = "leaderboard:global:v2";
export const LEGACY_GLOBAL_LEADERBOARD_KEY = "leaderboard:global:v1";

let cacheIsStale = true;

export const markCacheStale = (): void => {
  cacheIsStale = true;
};

export const markCacheFresh = (): void => {
  cacheIsStale = false;
};

export const isCacheReadable = (): boolean => !cacheIsStale;

export const upsertCachedScore = async (
  redis: Redis,
  input: { userId: string; totalXp: number; lastEarned: Date | null },
): Promise<void> => {
  const score = encodeRankingScore(input.totalXp, input.lastEarned);
  await redis.zadd(GLOBAL_LEADERBOARD_KEY, "GT", score, input.userId);
};

export const addCachedUser = async (
  redis: Redis,
  userId: string,
): Promise<void> => {
  await redis.zadd(
    GLOBAL_LEADERBOARD_KEY,
    "NX",
    encodeRankingScore(0, null),
    userId,
  );
};

const parseRange = (
  values: string[],
  firstRank: number,
): CachedLeaderboardEntry[] => {
  const entries: CachedLeaderboardEntry[] = [];

  for (let index = 0; index < values.length; index += 2) {
    const userId = values[index];
    const rawScore = values[index + 1];

    if (!userId || rawScore === undefined) {
      continue;
    }

    entries.push({
      userId,
      totalXp: decodeTotalXp(Number(rawScore)),
      rank: firstRank + index / 2,
    });
  }

  return entries;
};

export const getCachedRange = async (
  redis: Redis,
  start: number,
  stop: number,
): Promise<CachedLeaderboardEntry[]> => {
  const values = await redis.zrevrange(
    GLOBAL_LEADERBOARD_KEY,
    start,
    stop,
    "WITHSCORES",
  );

  return parseRange(values, start + 1);
};

export const getCachedUserRank = async (
  redis: Redis,
  userId: string,
): Promise<CachedLeaderboardEntry | null> => {
  const [position, rawScore] = await Promise.all([
    redis.zrevrank(GLOBAL_LEADERBOARD_KEY, userId),
    redis.zscore(GLOBAL_LEADERBOARD_KEY, userId),
  ]);

  if (position === null || rawScore === null) {
    return null;
  }

  return {
    userId,
    totalXp: decodeTotalXp(Number(rawScore)),
    rank: position + 1,
  };
};

export const getCachedRank = async (
  redis: Redis,
  userId: string,
): Promise<number | null> => {
  const position = await redis.zrevrank(GLOBAL_LEADERBOARD_KEY, userId);

  return position === null ? null : position + 1;
};

export const removeCachedUser = async (
  redis: Redis,
  userId: string,
): Promise<void> => {
  await redis.zrem(GLOBAL_LEADERBOARD_KEY, userId);
};
