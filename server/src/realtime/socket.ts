import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";

import { env } from "../config/env.js";
import { verifyAccessToken } from "../service/token.service.js";
import { logger } from "../utils/logger.js";
import {
  ClientToServerEvents,
  type InterServerEvents,
  type RealtimeServer,
  type ServerToClientEvents,
  type SocketData,
} from "../types/types.js";

export const GLOBAL_LEADERBOARD_ROOM = "leaderboard:global";

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
  } catch (error) {
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

  io.use((socket, next) => {
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
      socket.data.userId = verifyAccessToken(token).userId;
      next();
    } catch (error) {
      next(new Error("Authentication is required"));
    }
  });

  io.on("connection", (socket) => {
    socket.join(GLOBAL_LEADERBOARD_ROOM);

    logger.info(
      `Realtime client connected: ${socket.id} for user ${socket.data.userId}`,
    );

    socket.on("disconnect", () => {
      logger.info(`Realtime client disconnected: ${socket.id}`);
    });
  });

  return io;
};
