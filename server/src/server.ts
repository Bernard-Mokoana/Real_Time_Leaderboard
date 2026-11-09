import { createServer } from "node:http";
import type { Server as HttpServer } from "node:http";

import { createAdapter } from "@socket.io/redis-adapter";

import { createApp } from "./app.js";
import { closePool, startPool } from "./config/db.js";
import { env } from "./config/env.js";
import { closeRedis, startRedis } from "./config/redis.js";
import { setRealtimeServer, setRedis } from "./config/runtime.js";
import { applySchema } from "./config/schema.js";
import { createSocketServer } from "./realtime/socket.js";
import {
  rebuildGlobalLeaderboardCache,
  startCacheMaintenance,
} from "./service/leaderboard-cache-sync.service.js";
import { startSnapshotScheduler } from "./service/snapshot.service.js";
import type { RealtimeServer } from "./types/types.js";
import { logger } from "./utils/logger.js";

export type RunningServer = {
  httpServer: HttpServer;
  io: RealtimeServer;
  port: number;
  stop: () => Promise<void>;
};

export const startApplication = async (): Promise<RunningServer> => {
  const app = createApp();

  await startPool();
  await applySchema();

  const redisClients = await startRedis();

  setRedis(redisClients.publisher);

  try {
    await rebuildGlobalLeaderboardCache(redisClients.publisher);
  } catch (error) {
    logger.error(
      "Initial leaderboard cache build failed; serving from PostgreSQL.",
      error,
    );
  }

  const httpServer = createServer(app);
  const io = createSocketServer(httpServer);

  io.adapter(
    createAdapter(redisClients.publisher, redisClients.subscriber, {
      key: "leaderboard",
      publishOnSpecificResponseChannel: true,
    }),
  );

  setRealtimeServer(io);

  const stopMaintenance = startCacheMaintenance(redisClients.publisher);
  const stopSnapshots = startSnapshotScheduler();

  await new Promise<void>((resolve) => {
    httpServer.listen(env.PORT, resolve);
  });

  const address = httpServer.address();
  const port = typeof address === "object" && address ? address.port : env.PORT;

  logger.success(`Server listening on port ${port}`);

  const stop = async (): Promise<void> => {
    stopMaintenance();
    stopSnapshots();

    await new Promise<void>((resolve) => {
      io.close(() => resolve());
    });

    if (httpServer.listening) {
      await new Promise<void>((resolve, reject) => {
        httpServer.close((error) => (error ? reject(error) : resolve()));
      });
    }

    setRealtimeServer(null);
    setRedis(null);

    await closeRedis(redisClients);
    await closePool();
  };

  return { httpServer, io, port, stop };
};
