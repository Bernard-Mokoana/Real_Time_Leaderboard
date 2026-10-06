import { Router } from "express";

import { query } from "../config/db.js";
import { AppError } from "../errors/app_errors.js";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res, next) => {
  try {
    await query("SELECT 1");

    res.status(200).json({
      status: "Ok",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(
      new AppError({
        message: "Service is unavailable.",
        statusCode: 503,
        code: "SERVICE_UNAVAILABLE",
      }),
    );
  }
});
