import { Router } from "express";

import { requireAuth } from "../middleware/auth.middleware.js";
import {
  leaderboardQuerySchema,
  neighbourhoodQuerySchema,
  snapshotQuerySchema,
} from "../model/leaderboard.model.js";
import {
  getGlobalLeaderboard,
  getLeaderboardNeighbourhood,
  getSnapshotLeaderboard,
} from "../service/leaderboard.service.js";

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

leaderboardRouter.get("/me", requireAuth, async (req, res) => {
  const { window } = neighbourhoodQuerySchema.parse(req.query);

  const neighbourhood = await getLeaderboardNeighbourhood({
    viewerUserId: req.auth!.userId,
    window,
  });

  res.status(200).json({ data: neighbourhood });
});

leaderboardRouter.get("/snapshots", requireAuth, async (req, res) => {
  const query = snapshotQuerySchema.parse(req.query);

  const snapshot = await getSnapshotLeaderboard({
    timeframe: query.timeframe,
    periodKey: query.periodKey,
    limit: query.limit,
    ...(query.cursor ? { cursor: query.cursor } : {}),
  });

  res.status(200).json({ data: snapshot });
});
