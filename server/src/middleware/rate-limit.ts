import type { RequestHandler } from "express";

import { getRedis } from "../config/runtime.js";
import { AppError } from "../errors/app_errors.js";
import { logger } from "../utils/logger.js";

export const rateLimit = (options: {
  name: string;
  windowSeconds: number;
  max: number;
}): RequestHandler => {
  return async (req, res, next) => {
    const redis = getRedis();

    if (!redis) {
      next();
      return;
    }

    const key = `rl:{options.name}:${req.ip ?? "unknown"}`;

    try {
      await redis.set(key, 0, "EX", options.windowSeconds, "NX");
      const count = await redis.incr(key);

      if (count > options.max) {
        const retryAfter = Math.max(await redis.ttl(key), 1);
        res.set("Retry-After", String(retryAfter));

        next(
          new AppError({
            message: "Too many attempts. Please try again later.",
            statusCode: 429,
            code: "RATE_LIMITED",
          }),
        );
        return;
      }
    } catch (error) {
      logger.warn("Rate limiter unavailable; allowing the request.");
    }

    next();
  };
};
