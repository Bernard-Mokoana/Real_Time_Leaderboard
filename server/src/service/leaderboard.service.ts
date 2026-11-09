import type { Redis } from "ioredis";

import { pool } from "../config/db.js";
import { getRedis } from "../config/runtime.js";
import { AppError } from "../errors/app_errors.js";
import { leaderboardRepository } from "../repositories/leaderboard.repository.js";
import type {
  CachedLeaderboardEntry,
  LeaderboardEntry,
  LeaderboardNeighbourhood,
  LeaderboardPage,
  SnapshotPage,
} from "../types/leaderboard.js";
import {
  decodeLeaderboardCursor,
  encodeLeaderboardCursor,
} from "../utils/leaderboard-cursor.js";
import { logger } from "../utils/logger.js";
import { isValidPeriodKey } from "../utils/period.js";
import type { SnapshotTimeframe } from "../types/types.js";
import {
  getCachedRange,
  getCachedUserRank,
  isCacheReadable,
  markCacheStale,
} from "./leaderboard-cache.service.js";

const defaultLimit = 25;

type Profiles = Awaited<ReturnType<typeof leaderboardRepository.findProfiles>>;

const entryFrom = (
  ranked: CachedLeaderboardEntry,
  profiles: Profiles,
): LeaderboardEntry | null => {
  const profile = profiles.get(ranked.userId);

  if (!profile) {
    return null;
  }

  return {
    rank: ranked.rank,
    userId: ranked.userId,
    firstName: profile.first_name,
    lastName: profile.last_name,
    avatarUrl: profile.avatar_url,
    totalXp: ranked.totalXp,
    lastEarned: profile.last_earned,
  };
};

const isEntry = (entry: LeaderboardEntry | null): entry is LeaderboardEntry =>
  entry !== null;

const hydrate = async (
  ranked: readonly CachedLeaderboardEntry[],
  alsoLoad: readonly CachedLeaderboardEntry[] = [],
): Promise<{
  entries: LeaderboardEntry[];
  extras: (LeaderboardEntry | null)[];
}> => {
  const profiles = await leaderboardRepository.findProfiles(
    pool,
    [...ranked, ...alsoLoad].map((entry) => entry.userId),
  );

  return {
    entries: ranked.map((entry) => entryFrom(entry, profiles)).filter(isEntry),
    extras: alsoLoad.map((entry) => entryFrom(entry, profiles)),
  };
};

const usableRedis = (): Redis | null => {
  const redis = getRedis();

  return redis && isCacheReadable() ? redis : null;
};

const cacheFailed = (error: unknown): void => {
  markCacheStale();
  logger.warn(
    "Leaderboard cache read failed; serving from PostgreSQL until it is rebuilt.",
    error instanceof Error ? error.message : error,
  );
};

const viewerFromPostgres = async (
  userId: string,
): Promise<LeaderboardEntry | null> => {
  const found = await leaderboardRepository.findRank(pool, userId);

  if (!found) {
    return null;
  }

  const profile = (
    await leaderboardRepository.findProfiles(pool, [userId])
  ).get(userId);

  if (!profile) {
    return null;
  }

  return {
    rank: found.rank,
    userId,
    firstName: profile.first_name,
    lastName: profile.last_name,
    avatarUrl: profile.avatar_url,
    totalXp: Number(profile.total_xp ?? 0),
    lastEarned: profile.last_earned,
  };
};

const pageFromCache = async (
  redis: Redis,
  input: { offset: number; limit: number; viewerUserId: string },
): Promise<LeaderboardPage> => {
  const [ranked, viewerRank] = await Promise.all([
    getCachedRange(redis, input.offset, input.offset + input.limit),
    getCachedUserRank(redis, input.viewerUserId),
  ]);

  if (input.offset === 0 && ranked.length === 0) {
    throw new Error("Leaderboard cache is empty.");
  }

  const hasNextPage = ranked.length > input.limit;
  const pageEntries = ranked.slice(0, input.limit);

  const { entries, extras } = await hydrate(
    pageEntries,
    viewerRank ? [viewerRank] : [],
  );

  const viewer = extras[0] ?? null;

  return {
    entries,
    nextCursor: hasNextPage
      ? encodeLeaderboardCursor({ offset: input.offset + input.limit })
      : null,
    viewer,
  };
};

const pageFromPostgres = async (input: {
  offset: number;
  limit: number;
  viewerUserId: string;
}): Promise<LeaderboardPage> => {
  const [withExtra, viewer] = await Promise.all([
    leaderboardRepository.findPage(pool, {
      offset: input.offset,
      limit: input.limit + 1,
    }),
    viewerFromPostgres(input.viewerUserId),
  ]);

  const hasNextPage = withExtra.length > input.limit;

  return {
    entries: withExtra.slice(0, input.limit),
    nextCursor: hasNextPage
      ? encodeLeaderboardCursor({ offset: input.offset + input.limit })
      : null,
    viewer,
  };
};

export const getGlobalLeaderboard = async (input: {
  limit?: number;
  cursor?: string;
  viewerUserId: string;
}): Promise<LeaderboardPage> => {
  const limit = input.limit ?? defaultLimit;
  const offset = input.cursor
    ? decodeLeaderboardCursor(input.cursor).offset
    : 0;
  const redis = usableRedis();

  if (redis) {
    try {
      return await pageFromCache(redis, {
        offset,
        limit,
        viewerUserId: input.viewerUserId,
      });
    } catch (error) {
      cacheFailed(error);
    }
  }

  return pageFromPostgres({ offset, limit, viewerUserId: input.viewerUserId });
};

export const getLeaderboardNeighbourhood = async (input: {
  viewerUserId: string;
  window: number;
}): Promise<LeaderboardNeighbourhood> => {
  const redis = usableRedis();

  if (redis) {
    try {
      const me = await getCachedUserRank(redis, input.viewerUserId);

      if (!me) {
        return { viewer: null, above: [], below: [] };
      }

      const start = Math.max(0, me.rank - 1 - input.window);
      const ranked = await getCachedRange(
        redis,
        start,
        me.rank - 1 + input.window,
      );
      const { entries } = await hydrate(ranked);

      return {
        viewer: entries.find((entry) => entry.userId === me.userId) ?? null,
        above: entries.filter((entry) => entry.rank < me.rank),
        below: entries.filter((entry) => entry.rank > me.rank),
      };
    } catch (error) {
      cacheFailed(error);
    }
  }

  const found = await leaderboardRepository.findRank(pool, input.viewerUserId);

  if (!found) {
    return { viewer: null, above: [], below: [] };
  }

  const start = Math.max(0, found.rank - 1 - input.window);
  const entries = await leaderboardRepository.findPage(pool, {
    offset: start,
    limit: found.rank - 1 - start + 1 + input.window,
  });

  return {
    viewer: entries.find((entry) => entry.rank === found.rank) ?? null,
    above: entries.filter((entry) => entry.rank < found.rank),
    below: entries.filter((entry) => entry.rank > found.rank),
  };
};

export const getSnapshotLeaderboard = async (input: {
  timeframe: SnapshotTimeframe;
  periodKey: string;
  limit?: number;
  cursor?: string;
}): Promise<SnapshotPage> => {
  if (!isValidPeriodKey(input.timeframe, input.periodKey)) {
    throw new AppError({
      message: `"${input.periodKey}" is not a valid ${input.timeframe} period key.`,
      statusCode: 400,
      code: "INVALID_PERIOD_KEY",
    });
  }

  const limit = input.limit ?? defaultLimit;
  const offset = input.cursor
    ? decodeLeaderboardCursor(input.cursor).offset
    : 0;

  const withExtra = await leaderboardRepository.findSnapshotPage(pool, {
    timeframe: input.timeframe,
    periodKey: input.periodKey,
    offset,
    limit: limit + 1,
  });

  return {
    timeframe: input.timeframe,
    periodKey: input.periodKey,
    entries: withExtra.slice(0, limit),
    nextCursor:
      withExtra.length > limit
        ? encodeLeaderboardCursor({ offset: offset + limit })
        : null,
  };
};
