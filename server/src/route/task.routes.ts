import { Router } from "express";

import { pool } from "../config/db.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  completeTaskSchema,
  taskListQuerySchema,
  taskParamSchema,
} from "../model/task.model.js";
import { taskRepository } from "../repositories/task.repository.js";
import { completeTask } from "../service/task-completion.service.js";
import { TaskNotFoundError } from "../utils/error.util.js";

export const taskRouter = Router();

taskRouter.get("/", requireAuth, async (req, res) => {
  const { limit, offset } = taskListQuerySchema.parse(req.query);

  const { tasks, total } = await taskRepository.listForUser(pool, {
    userId: req.auth!.userId,
    limit,
    offset,
  });

  res.status(200).json({
    data: tasks,
    meta: { total, limit, offset },
  });
});

taskRouter.get("/:taskId", requireAuth, async (req, res) => {
  const { taskId } = taskParamSchema.parse(req.params);

  const task = await taskRepository.findByIdForUser(
    pool,
    taskId,
    req.auth!.userId,
  );

  if (!task) {
    throw new TaskNotFoundError(taskId);
  }

  res.status(200).json({ data: task });
});

taskRouter.post("/:taskId/complete", requireAuth, async (req, res) => {
  const { taskId } = taskParamSchema.parse(req.params);
  const { referenceId, answers } = completeTaskSchema.parse(req.body);

  const result = await completeTask({
    userId: req.auth!.userId,
    taskId,
    referenceId,
    answers,
  });

  res.status(result.wasAlreadyProcessed ? 200 : 201).json({
    data: {
      event: result.event,
      score: result.score,
      rank: result.rank,
      wasAlreadyProcessed: result.wasAlreadyProcessed,
    },
  });
});
