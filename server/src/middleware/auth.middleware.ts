import type { RequestHandler } from "express";

import { AppError } from "../errors/app_errors.js";
import { verifyAccessToken } from "../service/token.service.js";

const getBearerToken = (
  authorizationHeader: string | undefined,
): string | null => {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
};

export const requireAuth: RequestHandler = (req, _res, next) => {
  const token =
    getBearerToken(req.get("authorization")) ?? req.cookies.access_token;

  if (typeof token !== "string") {
    next(
      new AppError({
        message: "Authentication is required.",
        statusCode: 401,
        code: "UNAUTHENTICATED",
      }),
    );
    return;
  }

  try {
    req.auth = verifyAccessToken(token);
    next();
  } catch (error) {
    next(error);
  }
};
