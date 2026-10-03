import { app, setUpMiddleware } from "./app.js";
import { closePool, startPool } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";

const shutdownTimeoutMs = 30_000;

const startServer = async (): Promise<void> => {
  setUpMiddleware();

  await startPool();

  const server = app.listen(env.PORT, () => {
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

    server.close((serverError) => {
      void (async () => {
        if (serverError) {
          logger.error("Error while closing HTTP server.", serverError);
        }
        try {
          await closePool();
          process.exit(serverError ? 1 : 0);
        } catch (error) {
          logger.error("Error during graceful shutdown.", error);
          process.exit(1);
        }
      })();
    });
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
