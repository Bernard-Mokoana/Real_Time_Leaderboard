import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";

import { AppError } from "../errors/app_errors.js";
import { logger } from "../utils/logger.js";

const toAppError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof ZodError) {
    return new AppError({
      message: "Request validation failed.",
      statusCode: 400,
      code: "VALIDATION_ERROR",
      details: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  return new AppError({
    message: "An unexpected server error occurred.",
    statusCode: 500,
    code: "INTERNAL_SERVER_ERROR",
  });
};

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(
    new AppError({
      message: `Route ${req.method} ${req.originalUrl} was not found.`,
      statusCode: 404,
      code: "ROUTE_NOT_FOUND",
    }),
  );
};

export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const appError = toAppError(error);

  logger.error(
    `${req.method} failed with ${appError.statusCode} ${appError.code}`,
    error,
  );

  const response: {
    error: {
      code: string;
      message: string;
      details?: unknown;
    };
  } = {
    error: {
      code: appError.code,
      message: appError.message,
    },
  };

  if (appError.details !== undefined) {
    response.error.details = appError.details;
  }

  res.status(appError.statusCode).json(response);
};
