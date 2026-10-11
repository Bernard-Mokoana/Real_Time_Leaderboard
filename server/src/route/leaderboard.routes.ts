import { Router } from "express";
import { z } from "zod";

import { requireAuth } from "../middleware/auth.middleware.js";
import { getGlobalLeaderboard } from "../service/leaderboard.service.js";

export const leaderboardRouter = Router();

const leaderboardQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  cursor: z.string().min(1).optional(),
});

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
