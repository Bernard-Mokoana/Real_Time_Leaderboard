import type { Redis } from "ioredis";
import { Server } from "socket.io";

import type { PoolClient } from "pg";
import type { LeaderboardUpdateEvent } from "./leaderboard.js";

export type LogLevel = "info" | "warn" | "error" | "success" | "debug";

export type SnapshotTimeframe = "daily" | "weekly";

export type DatabaseClient = Pick<PoolClient, "query">;

export type RedisClients = {
  publisher: Redis;
  subscriber: Redis;
};

export type ClientToServerEvents = {};

export type ServerToClientEvents = {
  "leaderboard:updated": (payload: LeaderboardUpdateEvent) => void;
};

export type InterServerEvents = {};

export type SocketData = {
  userId: string;
};

export type RealtimeServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type MigrationRow = {
  filename: string;
};

export type CaptureResult = {
  inserted: number;
  alreadyCaptured: boolean;
};
