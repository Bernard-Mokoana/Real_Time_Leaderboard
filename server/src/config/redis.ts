import { Redis } from "ioredis";

import { env } from "./env.js";
import type { RedisClients } from "../types/types.js";
import { logger } from "../utils/logger.js";

export const startRedis = async (): Promise<RedisClients> => {
  const publisher = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });

  const subscriber = publisher.duplicate();

  publisher.on("error", (error: Error) => {
    logger.error("Redis publisher error.", error);
  });

  subscriber.on("error", (error: Error) => {
    logger.error("Redis subscriber error.", error);
  });

  try {
    await Promise.all([publisher.connect(), subscriber.connect()]);

    logger.success("Redis connections started.");

    return {
      publisher,
      subscriber,
    };
  } catch (error) {
    publisher.disconnect();
    subscriber.disconnect();

    logger.error("Unable to connect to Redis.", error);
    throw error;
  }
};

export const closeRedis = async (clients: RedisClients): Promise<void> => {
  await Promise.all([clients.publisher.quit(), clients.subscriber.quit()]);

  logger.info("Redis connections closed.");
};
