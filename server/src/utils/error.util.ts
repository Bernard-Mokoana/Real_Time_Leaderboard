export class TaskNotFoundError extends Error {
  constructor(taskId: string) {
    super(`Task "${taskId}" does not exist.`);
    this.name = "TaskNotFoundError";
  }
}

export class ScoreNotFoundError extends Error {
  constructor(userId: string) {
    super(`Score for user "${userId}" does not exists.`);
    this.name = "ScoreNotFoundError";
  }
}
