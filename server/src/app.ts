import express from "express";
import type { Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { env } from "./config/env.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/error.middleware.js";
import { apiRouter } from "./route/index.js";
import { logger } from "./utils/logger.js";

export const createApp = (): Express => {
  const app = express();

  app.disable("x-powered-by");

  if (env.TRUST_PROXY !== undefined) {
    app.set("trust proxy", env.TRUST_PROXY);
  }

  app.use(
    cors({
      origin: env.CORS_ORIGIN ?? (env.NODE_ENV === "production" ? false : true),
      credentials: Boolean(env.CORS_ORIGIN),
    }),
  );

  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());

  app.use((req, _res, next) => {
    logger.info(`Incoming request: ${req.method} ${req.path}`);
    next();
  });

  app.use("/api/v1", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
