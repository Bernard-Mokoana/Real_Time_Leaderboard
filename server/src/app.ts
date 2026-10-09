import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { env } from "./config/env.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/error.middleware.js";
import { apiRouter } from "./route/index.js";
import { logger } from "./utils/logger.js";

export const app = express();

export const setUpMiddleware = (): void => {
  app.disable("x-powered-by");

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
};
