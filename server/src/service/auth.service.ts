import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";
import { getRedis } from "../config/runtime.js";

import { withTransaction } from "../config/db.js";
import { AppError } from "../errors/app_errors.js";
import { scoreRepository } from "../repositories/score.repository.js";
import { userRepository } from "../repositories/user.repository.js";
import type { AuthUser, UserWithPassword } from "../types/user.js";
import { logger } from "../utils/logger.js";
import {
  addCachedUser,
  isCacheReadable,
  markCacheStale,
} from "./leaderboard-cache.service.js";

const passwordSaltRounds = 12;

const DUMMY_PASSWORD_HASH =
  "$2b$12$ObYXffDszrkEPMSLm.lJmOTVySMq48YzauLrA2m5Lc/yIQVLJvfza";

const isUniqueViolation = (error: unknown): boolean => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
};

const toAuthUser = (user: UserWithPassword): AuthUser => {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
};

export const registerUser = async (input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}): Promise<AuthUser> => {
  const email = input.email.toLowerCase().trim();
  const passwordHash = await bcrypt.hash(input.password, passwordSaltRounds);

  try {
    const user = await withTransaction(async (client) => {
      const created = await userRepository.create(client, {
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        email,
        passwordHash,
      });

      await scoreRepository.createInitialScore(client, created.id);

      return created;
    });

    // After commit, best effort: keep the Redis board in step with PostgreSQL.
    const redis = getRedis();

    if (redis && isCacheReadable()) {
      try {
        await addCachedUser(redis, user.id);
      } catch (cacheError) {
        markCacheStale();
        logger.error(
          "Unable to add the new user to the leaderboard cache.",
          cacheError,
        );
      }
    }

    return user;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError({
        message: "An account with this email already exists.",
        statusCode: 409,
        code: "EMAIL_ALREADY_IN_USE",
      });
    }

    throw error;
  }
};

export const loginUser = async (input: {
  email: string;
  password: string;
}): Promise<AuthUser> => {
  const user = await userRepository.findByEmail(
    pool,
    input.email.toLowerCase().trim(),
  );

  const passwordMatches = await bcrypt.compare(
    input.password,
    user?.passwordHash ?? DUMMY_PASSWORD_HASH,
  );

  if (!user || !passwordMatches) {
    throw new AppError({
      message: "Email or password is incorrect.",
      statusCode: 401,
      code: "INVALID_CREDENTIALS",
    });
  }

  return toAuthUser(user);
};
