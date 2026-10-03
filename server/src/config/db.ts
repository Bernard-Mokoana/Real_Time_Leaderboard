import pg from "pg";
import type { QueryResultRow } from "pg";

import { env } from "./env.js";
import { logger } from "../utils/logger.js";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.NODE_ENV === "production" ? { rejectUnauthorized: true } : false,
});

pool.on("error", (error) => {
  logger.error("Unexpected error on an idle PostgreSQL client", error);
});

export const query = async <T extends QueryResultRow>(
  text: string,
  values: readonly unknown[] = [],
) => {
  return pool.query<T>(text, values);
};

export const withTransaction = async <T>(
  operation: (client: pg.PoolClient) => Promise<T>,
): Promise<T> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await operation(client);

    await client.query("COMMIT");

    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      logger.error("Failed to roll back transaction.", rollbackError);
      client.release(rollbackError as Error);
      throw error;
    }
    client.release();
};

export const startPool = async (): Promise<void> => {
  try {
    await query("SELECT 1");
    logger.success("Database connection pool started successfully.");
  } catch (error) {
    logger.error("Failed to connect to PostgreSQL.", error);
    throw error;
  }
};

export const closePool = async (): Promise<void> => {
  await pool.end();
  logger.info("Database connection pool closed successfully.");
};
