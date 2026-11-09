import { Router } from "express";

import { getRealtimeServer } from "../config/runtime.js";
import { pool } from "../config/db.js";
import { AppError } from "../errors/app_errors.js";
import { getRequestToken, requireAuth } from "../middleware/auth.middleware.js";
import { rateLimit } from "../middleware/rate-limit.js";
import { registerSchema, loginSchema } from "../model/auth.model.js";
import { userRepository } from "../repositories/user.repository.js";
import { userRoom } from "../realtime/socket.js";
import { loginUser, registerUser } from "../service/auth.service.js";
import {
  authCookieOptions,
  revokeAccessToken,
  setAccessTokenCookie,
  verifyAccessToken,
} from "../service/token.service.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  rateLimit({ name: "register", windowSeconds: 3_600, max: 10 }),
  async (req, res) => {
    const input = registerSchema.parse(req.body);
    const user = await registerUser(input);

    setAccessTokenCookie(res, user.id);

    res.status(201).json({
      data: {
        user,
      },
    });
  },
);

authRouter.post(
  "/login",
  rateLimit({ name: "login", windowSeconds: 900, max: 20 }),
  async (req, res) => {
    const input = loginSchema.parse(req.body);
    const user = await loginUser(input);

    setAccessTokenCookie(res, user.id);

    res.status(200).json({
      data: {
        user,
      },
    });
  },
);

authRouter.post("/logout", async (req, res) => {
  const token = getRequestToken(req);

  if (token) {
    try {
      const payload = verifyAccessToken(token);

      await revokeAccessToken(payload);

      const sockets = await getRealtimeServer()
        ?.in(userRoom(payload.userId))
        .fetchSockets();

      for (const socket of sockets ?? []) {
        if (socket.data.tokenId === payload.tokenId) {
          socket.disconnect(true);
        }
      }
    } catch {
      // Already expired or invalid: there is nothing left to revoke.
    }
  }

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
