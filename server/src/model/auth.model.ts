import z from "zod";

export const registerSchema = z.object({
  firstName: z.string().trim().min(1).max(255),
  lastName: z.string().trim().min(1).max(255),
  email: z.email().trim().max(255),
  password: z.string().min(12).max(72),
});

export const loginSchema = z.object({
  email: z.email().trim().max(255),
  password: z.string().min(1).max(72),
});
