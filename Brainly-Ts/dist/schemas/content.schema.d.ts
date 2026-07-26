import { z } from "zod";
export declare const createContentSchema: z.ZodObject<{
    title: z.ZodString;
    link: z.ZodURL;
    type: z.ZodEnum<{
        image: "image";
        video: "video";
        article: "article";
        audio: "audio";
        tweet: "tweet";
        pdf: "pdf";
    }>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type CreateContentBody = z.infer<typeof createContentSchema>;
//# sourceMappingURL=content.schema.d.ts.map