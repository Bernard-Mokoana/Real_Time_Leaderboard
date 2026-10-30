import z from "zod";

export const taskParamSchema = z.object({
  taskId: z.uuid(),
});

export const completeTaskSchema = z.object({
  referenceId: z.uuid(),
});
