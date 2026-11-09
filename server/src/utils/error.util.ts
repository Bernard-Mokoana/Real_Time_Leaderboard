import { AppError } from "../errors/app_errors.js";

export class TaskNotFoundError extends AppError {
  constructor(taskId: string) {
    super({
      message: `Task "${taskId}" does not exist.`,
      statusCode: 404,
      code: "TASK_NOT_FOUND",
    });
    this.name = "TaskNotFoundError";
  }
}

export class ScoreNotFoundError extends AppError {
  constructor(userId: string) {
    super({
      message: `Score for user "${userId}" does not exist.`,
      statusCode: 404,
      code: "SCORE_NOT_FOUND",
    });
    this.name = "ScoreNotFoundError";
  }
}
