import pg from "pg";
import dotenv from "dotenv";
import { logger } from "../utils/logger.js";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: true }
      : false,
});

pool.on("error", (err, client) => {
  logger.error("Unexpected error on idle PostgreSQL client", err);
});

export const startPool = async () => {
  try {
    await pool.query("SELECT 1");
    logger.info("Database connection pool started successfully.");
  } catch (error) {
    logger.error("Failed to connect to Postgres:", error);
    process.exit(1);
  }
};

export const closePool = async () => {
  await pool.end();
  logger.info("Database connection closed.");
};
