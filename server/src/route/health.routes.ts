import { Router } from "express";

import { query } from "../config/db.js";
import { getRedis } from "../config/runtime.js";
import { AppError } from "../errors/app_errors.js";
import { isCacheReadable } from "../service/leaderboard-cache.service.js";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res, next) => {
  try {
    await query("SELECT 1");
  } catch {
    next(
      new AppError({
        message: "Service is unavailable.",
        statusCode: 503,
        code: "SERVICE_UNAVAILABLE",
      }),
    );
    return;
  }

  let redisStatus: "up" | "down" = "down";

  try {
    redisStatus = (await getRedis()?.ping()) === "PONG" ? "up" : "down";
  } catch {
    redisStatus = "down";
  }

  const healthy = redisStatus === "up" && isCacheReadable();

  res.status(200).json({
    status: healthy ? "Ok" : "Degraded",
    database: "up",
    redis: redisStatus,
    leaderboardCache: isCacheReadable() ? "fresh" : "stale",
    timestamp: new Date().toISOString(),
  });
});
