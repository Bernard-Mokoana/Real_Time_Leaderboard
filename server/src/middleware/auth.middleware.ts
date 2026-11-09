import type { Request, RequestHandler } from "express";

import { AppError } from "../errors/app_errors.js";
import {
  isAccessTokenRevoked,
  verifyAccessToken,
} from "../service/token.service.js";

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

export const getRequestToken = (req: Request): string | null => {
  const token =
    getBearerToken(req.get("authorization")) ?? req.cookies?.access_token;

  return typeof token === "string" ? token : null;
};

const unauthenticated = (): AppError =>
  new AppError({
    message: "Authentication is required.",
    statusCode: 401,
    code: "UNAUTHENTICATED",
  });

export const requireAuth: RequestHandler = async (req, _res, next) => {
  const token = getRequestToken(req);

  if (token === null) {
    next(unauthenticated());
    return;
  }

  try {
    const payload = verifyAccessToken(token);

    if (await isAccessTokenRevoked(payload.tokenId)) {
      next(unauthenticated());
      return;
    }

    req.auth = payload;
    next();
  } catch (error) {
    next(error);
  }
};
