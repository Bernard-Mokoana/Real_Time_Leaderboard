import type { Redis } from "ioredis";

import type { CachedLeaderboardEntry } from "../types/leaderboard.js";

export const GLOBAL_LEADERBOARD_KEY = "leaderboard:gloabal:v1";

export const updateCachedScore = async (
  redis: Redis,
  input: {
    userId: string;
    totalXp: number;
  },
): Promise<void> => {
  if (!Number.isSafeInteger(input.totalXp) || input.totalXp < 0) {
    throw new Error("Leaderboard score be a safe non-negative integer.");
  }

  await redis.zadd(GLOBAL_LEADERBOARD_KEY, input.totalXp, input.userId);
};

export const getTopCachedScores = async (
  redis: Redis,
  limit: number,
): Promise<CachedLeaderboardEntry[]> => {
  const values = await redis.zrevrange(
    GLOBAL_LEADERBOARD_KEY,
    0,
    limit - 1,
    "WITHSCORES",
  );

  const entries: CachedLeaderboardEntry[] = [];

  let previousScore: number | null = null;
  let currentRank = 0;

  for (let index = 0; index < values.length; index += 2) {
    const userId = values[index];
    const rawScore = values[index + 1];

    if (!userId || !rawScore) {
      continue;
    }

    const totalXp = Number(rawScore);
    const position = index / 2 + 1;

    // Equal scores share a competition rank: 1, 1, 3
    if (totalXp !== previousScore) {
      currentRank = position;
      previousScore = totalXp;
    }

    entries.push({
      userId,
      totalXp,
      rank: currentRank,
    });
  }

  return entries;
};

export const getCachedUserRank = async (
  redis: Redis,
  userId: string,
): Promise<CachedLeaderboardEntry | null> => {
  const rawScore = await redis.zscore(GLOBAL_LEADERBOARD_KEY, userId);

  if (rawScore === null) {
    return null;
  }

  const totalXp = Number(rawScore);

  // ZREVRANK gives ordinal position, not shared competition rank.
  // ZCOUNT gives the number of users strictly above this score.
  const usersWithHigherScores = await redis.zcount(
    GLOBAL_LEADERBOARD_KEY,
    `(${rawScore})`,
    "+inf",
  );

  return { userId, totalXp, rank: usersWithHigherScores + 1 };
};

export const removeCachedUser = async (
  redis: Redis,
  userId: string,
): Promise<void> => {
  await redis.zrem(GLOBAL_LEADERBOARD_KEY, userId);
};
