export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(options: {
    message: string;
    statusCode: number;
    code: string;
    details?: unknown;
  }) {
    super(options.message);

    this.name = "AppError";
    this.statusCode = options.statusCode;
    this.code = options.code;

    if (options.details !== undefined) {
      this.details = options.details;
    }
  }
}
