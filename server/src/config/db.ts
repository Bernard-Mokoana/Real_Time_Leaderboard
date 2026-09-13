import pg from "pg";
import dotenv from "dotenv";

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
  console.error("Unexpected error on idle PostgreSQL client", err);
});

export const startPool = async () => {
  try {
    await pool.query("SELECT 1");
    console.log("Database connection pool started successfully.");
  } catch (error) {
    console.error("Failed to connect to Postgres:", error);
    process.exit(1);
  }
};

export const closePool = async () => {
  await pool.end();
  console.log("Database connection closed.");
};
