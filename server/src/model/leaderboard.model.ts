import z from "zod";

export const leaderboardQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  cursor: z.string().min(1).optional(),
});

export const neighbourhoodQuerySchema = z.object({
  window: z.coerce.number().int().min(1).max(10).default(2),
});

export const snapshotQuerySchema = z.object({
  timeframe: z.enum(["daily", "weekly"]),
  periodKey: z.string().min(1).max(20),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  cursor: z.string().min(1).optional(),
});
