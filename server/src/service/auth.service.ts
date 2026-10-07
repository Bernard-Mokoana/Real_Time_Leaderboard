import bcrypt from "bcryptjs";
import { pool } from "../config/db.js";

import { withTransaction } from "../config/db.js";
import { AppError } from "../errors/app_errors.js";
import { scoreRepository } from "../repositories/score.repository.js";
import { userRepository } from "./user.repository.js";
import type { AuthUser, UserWithPassword } from "../types/user.js";

const passwordSaltRounds = 12;

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
    return await withTransaction(async (client) => {
      const user = await userRepository.create(client, {
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        email,
        passwordHash,
      });

      await scoreRepository.createInitialScore(client, user.id);

      return user;
    });
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
  const user = await userRepository.findByEmail(pool, input.email);

  const passwordMatches =
    user !== null && (await bcrypt.compare(input.password, user.passwordHash));

  if (!passwordMatches || !user) {
    throw new AppError({
      message: "Email or password is incorrect.",
      statusCode: 401,
      code: "INVALID_CREDENTIALS",
    });
  }

  return toAuthUser(user);
};
