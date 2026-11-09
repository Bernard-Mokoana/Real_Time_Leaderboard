import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";

import { env } from "../config/env.js";
import {
  isAccessTokenRevoked,
  verifyAccessToken,
} from "../service/token.service.js";
import { logger } from "../utils/logger.js";
import type {
  ClientToServerEvents,
  InterServerEvents,
  RealtimeServer,
  ServerToClientEvents,
  SocketData,
} from "../types/types.js";

export const GLOBAL_LEADERBOARD_ROOM = "leaderboard:global";

export const userRoom = (userId: string): string => `user:${userId}`;

const getCookieValue = (
  cookieHeader: string | undefined,
  cookieName: string,
): string | null => {
  if (!cookieHeader) {
    return null;
  }

  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`));

  if (!cookie) {
    return null;
  }

  try {
    return decodeURIComponent(cookie.slice(`${cookieName}=`.length));
  } catch {
    return null;
  }
};

export const createSocketServer = (httpServer: HttpServer): RealtimeServer => {
  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN ?? (env.NODE_ENV == "production" ? false : true),
      credentials: Boolean(env.CORS_ORIGIN),
    },
  });

  io.use(async (socket, next) => {
    const authToken = socket.handshake.auth.token;

    const token =
      typeof authToken === "string"
        ? authToken
        : getCookieValue(socket.handshake.headers.cookie, "access_token");

    if (!token) {
      next(new Error("Authentication is required."));
      return;
    }

    try {
      const payload = verifyAccessToken(token);

      if (await isAccessTokenRevoked(payload.tokenId)) {
        next(new Error("Authentication is required."));
        return;
      }

      socket.data.userId = payload.userId;
      socket.data.tokenId = payload.tokenId;
      socket.data.expiresAt = payload.expiresAt;
      next();
    } catch {
      next(new Error("Authentication is required."));
    }
  });

  io.on("connection", (socket) => {
    void socket.join([GLOBAL_LEADERBOARD_ROOM, userRoom(socket.data.userId)]);

    logger.info(
      `Realtime client connected: ${socket.id} for user ${socket.data.userId}`,
    );

    const msUntilExpiry = socket.data.expiresAt * 1000 - Date.now();
    const expiryTimer = setTimeout(
      () => socket.disconnect(true),
      Math.max(msUntilExpiry, 0),
    );
    expiryTimer.unref();

    socket.on("disconnect", () => {
      clearTimeout(expiryTimer);
      logger.info(`Realtime client disconnected: ${socket.id}`);
    });
  });

  return io;
};
