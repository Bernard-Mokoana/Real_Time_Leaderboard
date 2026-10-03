import chalk from "chalk";
const getTimestamp = () => {
  return new Date().toISOString();
};
const log = (level, message, ...optionalParams) => {
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
  info: (msg, ...params) => log("info", msg, ...params),
  warn: (msg, ...params) => log("warn", msg, ...params),
  error: (msg, ...params) => log("error", msg, ...params),
  success: (msg, ...params) => log("success", msg, ...params),
  debug: (msg, ...params) => log("debug", msg, ...params),
};
