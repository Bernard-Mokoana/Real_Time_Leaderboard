import type { Redis } from "ioredis";
import { Server } from "socket.io";

import type { PoolClient } from "pg";
import type {
  LeaderboardSnapshotEvent,
  LeaderboardUpdateEvent,
} from "./leaderboard.js";

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
  "leaderboard:snapshot": (payload: LeaderboardSnapshotEvent) => void;
};

export type InterServerEvents = {};

export type SocketData = {
  userId: string;
  tokenId: string;
  expiresAt: number;
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

export type RebuildRow = {
  user_id: string;
  total_xp: string;
  last_earned: Date | null;
};
