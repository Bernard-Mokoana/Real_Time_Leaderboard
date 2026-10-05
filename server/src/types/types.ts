import type { PoolClient } from "pg";

export type LogLevel = "info" | "warn" | "error" | "success" | "debug";

export type DatabaseClient = Pick<PoolClient, "query">;
