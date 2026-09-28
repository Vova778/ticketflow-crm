import { z } from "zod";
import { priorities } from "./types";
export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters"),
});
export const registerSchema = loginSchema.extend({
  firstName: z.string().trim().min(1, "Enter your first name"),
  lastName: z.string().trim().min(1, "Enter your last name"),
});
export const ticketSchema = z.object({
  title: z.string().trim().min(3, "Use at least 3 characters").max(120),
  description: z
    .string()
    .trim()
    .min(10, "Add at least 10 characters of detail")
    .max(5000),
  priority: z.enum(priorities),
});
export const commentSchema = z.object({
  content: z.string().trim().min(1, "Write a comment first").max(5000),
});
