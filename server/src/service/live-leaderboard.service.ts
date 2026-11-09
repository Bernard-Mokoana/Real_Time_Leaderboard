import type { Redis } from "ioredis";

import { pool } from "../config/db.js";
import { userRepository } from "../repositories/user.repository.js";
import type {
  LiveLeaderboard,
  LiveLeaderboardEntry,
} from "../types/leaderboard.js";
import {
  getTopCachedScores,
  GLOBAL_LEADERBOARD_KEY,
  removeCachedUser,
} from "./leaderboard-cache.service.js";

const resolveLiveLeaderboard = async (
  redis: Redis,
  limit: number,
): Promise<{
  entries: LiveLeaderboardEntry[];
  staleUserIds: string[];
}> => {
  const cachedScores = await getTopCachedScores(redis, limit);

  const profiles = await userRepository.findLeaderboardProfilesByIds(
    pool,
    cachedScores.map((entry) => entry.userId),
  );

  const profilesByUserId = new Map(
    profiles.map((profile) => [profile.userId, profile]),
  );

  const entries: LiveLeaderboardEntry[] = [];
  const staleUserIds: string[] = [];

  for (const cachedScore of cachedScores) {
    const profile = profilesByUserId.get(cachedScore.userId);

    if (!profile) {
      staleUserIds.push(cachedScore.userId);
      continue;
    }

    entries.push({
      ...profile,
      rank: cachedScore.rank,
      totalXp: cachedScore.totalXp,
    });
  }

  return {
    entries,
    staleUserIds,
  };
};

export const getLiveTopLeaderboard = async (input: {
  redis: Redis;
  limit: number;
}): Promise<LiveLeaderboard> => {
  let resolved = await resolveLiveLeaderboard(input.redis, input.limit);

  while (
    resolved.staleUserIds.length > 0 &&
    resolved.entries.length < input.limit
  ) {
    await Promise.all(
      resolved.staleUserIds.map((userId) =>
        removeCachedUser(input.redis, userId),
      ),
    );

    resolved = await resolveLiveLeaderboard(input.redis, input.limit);
  }

  const totalParticipants = await input.redis.zcard(GLOBAL_LEADERBOARD_KEY);

  return {
    entries: resolved.entries,
    totalParticipants,
  };
};
