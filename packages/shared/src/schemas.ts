import { z } from "zod";

export const coachInputSchema = z.object({
  message: z.string().trim().min(1, "Message cannot be empty").max(1000, "Message cannot exceed 1000 characters"),
});

export const timeFormatRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
export const dateFormatRegex = /^\d{4}-\d{2}-\d{2}$/;

export const reviewInputSchema = z.object({
  kind: z.enum(["morning", "evening"]),
  date: z.string().regex(dateFormatRegex, "Date must be YYYY-MM-DD"),
  now: z.string().regex(timeFormatRegex, "Time must be HH:MM in 24h format"),
});
