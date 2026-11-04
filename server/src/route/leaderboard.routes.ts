import { Router } from "express";
import { z } from "zod";

import type { Redis } from "ioredis";

import { requireAuth } from "../middleware/auth.middleware.js";
import { getGlobalLeaderboard } from "../service/leaderboard.service.js";
import { getLiveTopLeaderboard } from "../service/live-leaderboard.service.js";

import {
  leaderboardQuerySchema,
  topLeaderboardQuerySchema,
} from "../model/leaderboard.model.js";
import { AppError } from "../errors/app_errors.js";

export const leaderboardRouter = Router();

leaderboardRouter.get("/", requireAuth, async (req, res) => {
  const query = leaderboardQuerySchema.parse(req.query);

  const leaderboard = await getGlobalLeaderboard({
    limit: query.limit,
    ...(query.cursor ? { cursor: query.cursor } : {}),
    viewerUserId: req.auth!.userId,
  });

  res.status(200).json({
    data: leaderboard,
  });
});

leaderboardRouter.get("/top", requireAuth, async (req, res) => {
  const { limit } = topLeaderboardQuerySchema.parse(req.query);

  const redis = req.app.locals.redis as Redis | undefined;

  if (!redis) {
    throw new AppError({
      message: "Live leaderboard is temporarily unavailable.",
      statusCode: 503,
      code: "LIVE_LEADERBOARD_UNAVAILABLE",
    });
  }

  const leaderboard = await getLiveTopLeaderboard({
    redis,
    limit,
  });

  res.status(200).json({ data: leaderboard });
});
