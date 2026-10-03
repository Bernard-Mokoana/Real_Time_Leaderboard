import { app, setUpMiddleware } from "./app.js";
import { closePool, startPool } from "./config/db.js";
import dotenv from "dotenv";
import { logger } from "./utils/logger.js";

dotenv.config();

const SHUTDOWN_TIMEOUT_MS = 30_000;

const startServer = async () => {
  const rawPort = process.env.PORT;
  const PORT = rawPort === undefined || rawPort === "" ? 8001 : Number(rawPort);
  if (!Number.isSafeInteger(PORT) || PORT < 1 || PORT > 65535) {
    throw new Error("PORT must be an integer from 1 to 65535");
  }

  setUpMiddleware();

  await startPool();

  const server = app.listen(PORT, async () => {
    logger.info(`Listening to PORT: ${PORT}`);
  });

  const shutdown = (signal: string) => {
    logger.info(`Received ${signal}, shutting down gracefully`);

    const forceExitTimer = setTimeout(() => {
      logger.error(
        `Graceful shutdown timed out after ${SHUTDOWN_TIMEOUT_MS}ms, forcing exit`,
        ``,
      );
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    server.close(async (err) => {
      if (err) {
        logger.error("Error while closing HTTP server", err);
      }
      try {
        await closePool();
        logger.info("Database pool closed");
        process.exit(err ? 1 : 0);
      } catch (poolError) {
        logger.error("Error while closing database pool", poolError);
        process.exit(1);
      }
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

await startServer();
