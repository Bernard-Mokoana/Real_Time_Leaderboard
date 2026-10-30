import { readdir, readFile } from "node:fs/promises";

import { pool } from "./db.js";
import { logger } from "../utils/logger.js";

import type { MigrationRow } from "../types/types.js";

const schemaDirectory = new URL("../../sql_script/", import.meta.url);

const migrationFilePattern = /^(init|\d{3}_[a-z0-9_]+)\.sql$/i;
const migrationLockId = 8_413_572_001;

const compareMigrationFiles = (left: string, right: string): number => {
  if (left === "init.sql") {
    return -1;
  }

  if (right === "init.sql") {
    return 1;
  }

  return left.localeCompare(right);
};

export const applySchema = async (): Promise<void> => {
  const client = await pool.connect();

  try {
    await client.query("SELECT pg_advisory_lock($1)", [migrationLockId]);

    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const migrationFiles = (await readdir(schemaDirectory))
      .filter((file) => migrationFilePattern.test(file))
      .sort(compareMigrationFiles);

    const appliedResult = await client.query<MigrationRow>(
      `
        SELECT filename
        FROM schema_migrations
      `,
    );

    const appliedMigrations = new Set(
      appliedResult.rows.map((row) => row.filename),
    );

    for (const filename of migrationFiles) {
      if (appliedMigrations.has(filename)) {
        continue;
      }

      const sql = await readFile(new URL(filename, schemaDirectory), "utf8");

      logger.info(`Applying database migration: ${filename}`);
      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query(
          `
          INSERT INTO schema_migrations (filename)
          VALUES ($1)
          `,
          [filename],
        );
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }

    logger.success("Database schema is ready.");
  } finally {
    let releaseError: Error | undefined;

    try {
      await client.query("SELECT pg_advisory_unlock($1)", [migrationLockId]);
    } catch (error) {
      releaseError = error instanceof Error ? error : new Error(String(error));
      logger.error(`Failed to release migration lock: ${releaseError.message}`);
    } finally {
      client.release(releaseError);
    }
  }
};
