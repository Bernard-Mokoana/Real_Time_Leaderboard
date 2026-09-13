import chalk from "chalk";
import type { LogLevel } from "../types/types.js";

const getTimestamp = (): string => {
  return new Date().toISOString();
};

const log = (level: LogLevel, message: string, ...optionalParams: any[]) => {
  const timestamp = getTimestamp();

  const prefix = {
    info: chalk.blueBright("[INFO]"),
    warn: chalk.yellow("[WARN]"),
    error: chalk.red("[ERROR]"),
    success: chalk.green("[SUCCESS]"),
    debug: chalk.magenta("[DEBUG]"),
  }[level];

  console.log(
    `${chalk.gray(timestamp)} ${prefix} ${message}`,
    ...optionalParams,
  );
};

export const logger = {
  info: (msg: string, ...params: any[]) => log("info", msg, ...params),
  warn: (msg: string, ...params: any[]) => log("warn", msg, ...params),
  error: (msg: string, ...params: any[]) => log("error", msg, ...params),
  success: (msg: string, ...params: any[]) => log("success", msg, ...params),
  debug: (msg: string, ...params: any[]) => log("debug", msg, ...params),
};
