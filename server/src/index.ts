import { createServer } from "node:http";

import { createAdapter } from "@socket.io/redis-adapter";

import { app, setUpMiddleware } from "./app.js";
import { closePool, startPool } from "./config/db.js";
import { closeRedis, startRedis } from "./config/redis.js";
import { env } from "./config/env.js";
import { createSocketServer } from "./realtime/socket.js";
import { logger } from "./utils/logger.js";
import { resolve } from "node:path";
import { rebuildGlobalLeaderboardCache } from "./service/leaderboard-cache-sync.service.js";

const shutdownTimeoutMs = 30_000;

const startServer = async (): Promise<void> => {
  setUpMiddleware();

  await startPool();

  const redisClients = await startRedis();

  await rebuildGlobalLeaderboardCache(redisClients.publisher);

  app.locals.redis = redisClients.publisher;

  const httpServer = createServer(app);
  const io = createSocketServer(httpServer);

  io.adapter(
    createAdapter(redisClients.publisher, redisClients.subscriber, {
      key: "leaderboard",
      publishOnSpecificResponseChannel: true,
    }),
  );

  app.locals.io = io;

  httpServer.listen(env.PORT, () => {
    logger.success(`Server listening on port ${env.PORT}`);
  });

  let isShuttingDown = false;

  const shutdown = (signal: NodeJS.Signals): void => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;

    logger.info(`Received ${signal}; shutting down gracefully.`);

    const forceExitTimer = setTimeout(() => {
      logger.error(`Graceful shutdown timed out after ${shutdownTimeoutMs}ms.`);
      process.exit(1);
    }, shutdownTimeoutMs);

    forceExitTimer.unref();

    void (async () => {
      try {
        await new Promise<void>((resolve) => {
          io.close(() => resolve());
        });

        await closeRedis(redisClients);
        await new Promise<void>((resolve, reject) => {
          httpServer.close((serverError) =>
            serverError ? reject(serverError) : resolve(),
          );
        });
        await closePool();
        process.exit(0);
      } catch (error) {
        logger.error("Error during graceful shutdown.", error);
        process.exit(1);
      }
    })();
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
};

try {
  await startServer();
} catch (error) {
  logger.error("Unable to start server.", error);
  process.exit(1);
}
