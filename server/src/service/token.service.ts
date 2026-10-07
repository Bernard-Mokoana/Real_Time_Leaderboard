import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { AppError } from "../errors/app_errors.js";
import type { AccessTokenPayload } from "../types/auth.js";

export const createAccessToken = (userId: string): string => {
  return jwt.sign(
    {
      type: "access",
    },
    env.JWT_SECRET,
    {
      subject: userId,
      expiresIn: env.JWT_EXPIRES_IN,
    },
  );
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);

    if (
      typeof decoded !== "object" ||
      decoded === null ||
      decoded.type !== "access" ||
      typeof decoded.sub !== "string"
    ) {
      throw new Error("Invalid token payload.");
    }

    return {
      userId: decoded.sub,
    };
  } catch {
    throw new AppError({
      message: "Authentication is required.",
      statusCode: 401,
      code: "UNAUTHENTICATED",
    });
  }
};
