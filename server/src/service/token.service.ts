import { randomUUID } from "node:crypto";
import type { CookieOptions, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { getRedis } from "../config/runtime.js";
import { AppError } from "../errors/app_errors.js";
import type { AccessTokenPayload } from "../types/auth.js";
import { logger } from "../utils/logger.js";

const REVOKED_KEY_PREFIX = "auth:revoked:";

export const createAccessToken = (userId: string): string => {
  return jwt.sign(
    {
      type: "access",
    },
    env.JWT_SECRET,
    {
      algorithm: "HS256",
      subject: userId,
      expiresIn: env.JWT_EXPIRES_IN,
      jwtid: randomUUID(),
    },
  );
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    if (
      typeof decoded === "string" ||
      decoded.type !== "access" ||
      typeof decoded.sub !== "string" ||
      typeof decoded.jti !== "string" ||
      typeof decoded.exp !== "number"
    ) {
      throw new Error("Invalid token payload.");
    }

    return {
      userId: decoded.sub,
      tokenId: decoded.jti,
      expiresAt: decoded.exp,
    };
  } catch {
    throw new AppError({
      message: "Authentication is required.",
      statusCode: 401,
      code: "UNAUTHENTICATED",
    });
  }
};

export const revokeAccessToken = async (
  payload: AccessTokenPayload,
): Promise<boolean> => {
  const redis = getRedis();
  const secondsLeft = payload.expiresAt - Math.floor(Date.now() / 1000);

  if (!redis || secondsLeft <= 0) {
    return secondsLeft <= 0;
  }

  try {
    await redis.set(
      `${REVOKED_KEY_PREFIX}${payload.tokenId}`,
      "1",
      "EX",
      secondsLeft,
    );
    return true;
  } catch (error) {
    logger.error("Unable to revoke the access token.", error);
    return false;
  }
};

export const isAccessTokenRevoked = async (
  tokenId: string,
): Promise<boolean> => {
  const redis = getRedis();

  if (!redis) {
    return false;
  }

  try {
    return (await redis.exists(`${REVOKED_KEY_PREFIX}${tokenId}`)) === 1;
  } catch (error) {
    logger.warn("Unable to check the token denylist; allowing the request.");
    return false;
  }
};

export const authCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

export const setAccessTokenCookie = (
  response: Response,
  userId: string,
): void => {
  response.cookie("access_token", createAccessToken(userId), authCookieOptions);
};
