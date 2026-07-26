import { z } from "zod";
export const createContentSchema = z.object({
    title: z.string().trim().min(1),
    link: z.url(),
    type: z.enum(["image", "video", "article", "tweet", "pdf", "audio"]),
    tags: z.array(z.string().regex(/^[a-f\d]{24}$/i, "Invalid tag id")).default([]),
});
//# sourceMappingURL=content.schema.js.map