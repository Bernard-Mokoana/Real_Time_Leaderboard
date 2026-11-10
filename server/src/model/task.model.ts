import z from "zod";

export const taskParamSchema = z.object({
  taskId: z.uuid(),
});

export const completeTaskSchema = z.object({
  referenceId: z.uuid(),
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        answer: z.string().min(1),
      }),
    )
    .length(5),
});

export const taskListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(100_000).default(0),
});
