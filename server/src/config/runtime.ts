import type { Redis } from "ioredis";
import type { RealtimeServer } from "../types/types.js";

const runtime: { redis: Redis | null; io: RealtimeServer | null } = {
  redis: null,
  io: null,
};

export const setRedis = (redis: Redis | null): void => {
  runtime.redis = redis;
};

export const getRedis = (): Redis | null => runtime.redis;

export const setRealtimeServer = (io: RealtimeServer | null): void => {
  runtime.io = io;
};

export const getRealtimeServer = (): RealtimeServer | null => runtime.io;
