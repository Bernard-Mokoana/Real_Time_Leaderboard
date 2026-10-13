import { readdir, readFile } from "node:fs/promises";

import { pool } from "./db.js";
import { logger } from "../utils/logger.js";

const schemaDirectory = new URL("../../sql_script/", import.meta.url);

const compareSchemaFiles = (left: string, right: string): number => {
  if (left === "init.sql") {
    return -1;
  }

  if (right === "init.sql") {
    return 1;
  }

  return left.localeCompare(right);
};

export const applySchema = async (): Promise<void> => {
  const schemaFiles = (await readdir(schemaDirectory))
    .filter((file) => file.endsWith(".sql"))
    .sort(compareSchemaFiles);

  for (const file of schemaFiles) {
    const sql = await readFile(new URL(file, schemaDirectory), "utf8");
    await pool.query(sql);
  }

  logger.success("Database schema is ready.");
};
