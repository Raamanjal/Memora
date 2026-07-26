import { z } from "zod";

export const createTagSchema = z.object({
  title: z.string().trim().min(1).max(50),
});

export const updateTagSchema = createTagSchema;
