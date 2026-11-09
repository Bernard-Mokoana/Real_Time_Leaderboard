import { startApplication } from "./server.js";
import { logger } from "./utils/logger.js";

const shutdownTimeoutMs = 30_000;

try {
  const running = await startApplication();

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

    void running
      .stop()
      .then(() => process.exit(0))
      .catch((error: unknown) => {
        logger.error("Error during graceful shutdown.", error);
        process.exit(1);
      });
  };

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
} catch (error) {
  logger.error("Unable to start server.", error);
  process.exit(1);
}
