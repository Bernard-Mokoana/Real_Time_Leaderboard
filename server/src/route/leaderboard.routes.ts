import { Router } from "express";
import { z } from "zod";

import { requireAuth } from "../middleware/auth.middleware.js";
import { getGlobalLeaderboard } from "../service/leaderboard.service.js";

import { leaderboardQuerySchema } from "../model/leaderboard.model.js";

export const leaderboardRouter = Router();

leaderboardRouter.get("/", requireAuth, async (req, res) => {
  const query = leaderboardQuerySchema.parse(req.query);

  const leaderboard = await getGlobalLeaderboard({
    limit: query.limit,
    cursor: query.cursor,
    viewerUserId: req.auth!.userId,
  });

  res.status(200).json({
    data: leaderboard,
  });
});
