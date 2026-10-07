import type { CookieOptions, Response } from "express";
import { Router } from "express";
import { z } from "zod";

import { env } from "../config/env.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { userRepository } from "../service/user.repository.js";
import { loginUser, registerUser } from "../service/auth.service.js";
import { createAccessToken } from "../service/token.service.js";
import { pool } from "../config/db.js";
import { AppError } from "../errors/app_errors.js";

export const authRouter = Router();

const authCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

const registerSchema = z.object({
  firstName: z.string().trim().min(1).max(255),
  lastName: z.string().trim().min(1).max(255),
  email: z.string().trim().email().max(100),
  password: z.string().min(12).max(72),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(100),
  password: z.string().min(1).max(72),
});

const setAccessTokenCookie = (response: Response, userId: string): void => {
  response.cookie("access_token", createAccessToken(userId), authCookieOptions);
};

authRouter.post("/register", async (req, res) => {
  const input = registerSchema.parse(req.body);
  const user = await registerUser(input);

  setAccessTokenCookie(res, user.id);

  res.status(201).json({
    data: {
      user,
    },
  });
});

authRouter.post("/login", async (req, res) => {
  const input = loginSchema.parse(req.body);
  const user = await loginUser(input);

  setAccessTokenCookie(res, user.id);

  res.status(200).json({
    data: {
      user,
    },
  });
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie("access_token", authCookieOptions);
  res.status(204).send();
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await userRepository.findById(pool, req.auth!.userId);

  if (!user) {
    throw new AppError({
      message: "Authentication is required.",
      statusCode: 401,
      code: "UNAUTHENTICATED",
    });
  }

  res.status(200).json({
    data: {
      user,
    },
  });
});
