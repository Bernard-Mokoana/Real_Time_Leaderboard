import z from "zod";

import { AppError } from "../errors/app_errors.js";
import type { LeaderboardCursor } from "../types/leaderboard.js";

const cursorSchema = z.object({
  offset: z.number().int().safe().min(0),
});

export const encodeLeaderboardCursor = (cursor: LeaderboardCursor): string => {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
};

export const decodeLeaderboardCursor = (
  encodedCursor: string,
): LeaderboardCursor => {
  try {
    const parsed = JSON.parse(
      Buffer.from(encodedCursor, "base64url").toString("utf8"),
    );

    return cursorSchema.parse(parsed);
  } catch (error) {
    throw new AppError({
      message: "The leaderboard cursor is invalid.",
      statusCode: 400,
      code: "INVALID_CURSOR",
    });
  }
};
