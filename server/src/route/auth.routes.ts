import type { CookieOptions, Response } from "express";
import { Router } from "express";

import { requireAuth } from "../middleware/auth.middleware.js";
import { userRepository } from "../repositories/user.repository.js";
import { loginUser, registerUser } from "../service/auth.service.js";
import { pool } from "../config/db.js";
import { AppError } from "../errors/app_errors.js";
import { registerSchema, loginSchema } from "../model/auth.model.js";
import {
  authCookieOptions,
  setAccessTokenCookie,
} from "../service/token.service.js";

export const authRouter = Router();

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
