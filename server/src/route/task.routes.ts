import { Router } from "express";
import z from "zod";

import { requireAuth } from "../middleware/auth.middleware.js";
import { awardXp } from "../service/award-xp.service.js";

import type { RealtimeServer } from "../types/types.js";
import { GLOBAL_LEADERBOARD_ROOM } from "../realtime/socket.js";

export const taskRouter = Router();

const taskParamSchema = z.object({
  taskId: z.string().uuid(),
});

const completeTaskSchema = z.object({
  referenceId: z.string().uuid(),
});

taskRouter.post("/:taskId/complete", requireAuth, async (req, res) => {
  const { taskId } = taskParamSchema.parse(req.params);
  const { referenceId } = completeTaskSchema.parse(req.body);

  const result = await awardXp({
    userId: req.auth!.userId,
    taskId,
    referenceId,
  });

  const io = req.app.locals.io as RealtimeServer | undefined;

  if (!result.wasAlreadyProcessed && io) {
    io.to(GLOBAL_LEADERBOARD_ROOM).emit("leaderboard:updated", {
      userId: result.event.userId,
      xpDelta: result.event.xpDelta,
      totalXp: result.score.totalXp,
      occurredAt: result.event.createdAt.toISOString(),
    });
  }

  res.status(result.wasAlreadyProcessed ? 200 : 201).json({
    data: {
      event: result.event,
      score: result.score,
      wasAlreadyProcessed: result.wasAlreadyProcessed,
    },
  });
});
