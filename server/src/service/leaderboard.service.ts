import { pool } from "../config/db.js";
import { leaderboardRepository } from "../repositories/leaderboard.repository.js";
import type { LeaderboardPage } from "../types/leaderboard.js";
import {
  decodeLeaderboardCursor,
  encodeLeaderboardCursor,
} from "../utils/leaderboard-cursor.js";

const defaultLimit = 25;

export const getGlobalLeaderboard = async (input: {
  limit?: number;
  cursor?: string;
  viewerUserId: string;
}): Promise<LeaderboardPage> => {
  const limit = input.limit ?? defaultLimit;
  const cursor = input.cursor ? decodeLeaderboardCursor(input.cursor) : null;

  const entriesWithExtraItem = await leaderboardRepository.findPage(pool, {
    cursor,
    limit: limit + 1,
  });

  const hasNextPage = entriesWithExtraItem.length > limit;
  const entries = entriesWithExtraItem.slice(0, limit);

  const lastEntry = entries.at(-1);

  const nextCursor =
    hasNextPage && lastEntry
      ? encodeLeaderboardCursor({
          totalXp: lastEntry.totalXp,
          userId: lastEntry.userId,
        })
      : null;

  const viewer = await leaderboardRepository.findByUserId(
    pool,
    input.viewerUserId,
  );

  return { entries, nextCursor, viewer };
};
