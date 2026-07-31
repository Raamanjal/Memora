import type { Request, Response } from "express";
import { parseUserIntent, detectContentType } from "../services/aiDetector.js";
import { processContent } from "../services/embeddingService.js";
import { content } from "../model/Content.js";
import { Tag } from "../model/Tag.js";
import { Types } from "mongoose";

export async function chat(req: Request, res: Response) {
  try {
    const { message } = req.body;
    const userId = req.userId; // injected by auth middleware

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    if (!message) {
      return res.status(400).json({ message: "Message is required." });
    }

    // 1. Tool Calling! Gemini decides if it's a "save" or "ask"
    // If it's a save, it automatically extracts the URL, type, and a title.
    const intent = await parseUserIntent(message);

    if (intent.action === "save") {
      console.log(`[AI Chat] Tool called! Extracted URL: ${intent.url}, Type: ${intent.type}`);

      // Fallbacks just in case the tool didn't return them
      let type = intent.type || await detectContentType(intent.url, intent.message);
      
      // Hardcoded safety net to guarantee embeds work correctly
      if (intent.url.includes("youtube.com") || intent.url.includes("youtu.be")) {
          type = "video";
      } else if (intent.url.includes("twitter.com") || intent.url.includes("x.com")) {
          type = "tweet";
      }

      const title = intent.suggestedTitle || "Untitled Content";

      // Process tags
      const tagIds: Types.ObjectId[] = [];
      if (intent.tags && intent.tags.length > 0) {
        for (const tagName of intent.tags) {
          const lowerName = tagName.toLowerCase().trim();
          if (!lowerName) continue;

          // Note: for robustness we might want to do a case-insensitive search, 
          // but we're storing them lowercase.
          let tag = await Tag.findOne({ title: new RegExp(`^${lowerName}$`, 'i'), userId });
          if (!tag) {
            tag = await Tag.create({ title: lowerName, userId });
          }
          tagIds.push(tag._id as Types.ObjectId);
        }
      }

      // 2. Save it to MongoDB immediately (so the user doesn't wait)
      const newContent = await content.create({
        link: intent.url,
        type: type,
        title: title,
        userId: userId,
        tags: tagIds,
      });

      // 3. Kick off the ingestion pipeline in the background!
      processContent(newContent._id.toString(), userId, intent.url, type, intent.message)
        .catch(err => console.error("Pipeline crashed:", err));

      return res.status(200).json({
        message: "Content is being saved and processed!",
        contentId: newContent._id,
        action: "save",
        detectedType: type,
        title: title,
        url: intent.url
      });

    } else {
      // User wants to ASK a question (RAG)
      console.log(`[AI Chat] User is asking: ${intent.query}`);

      // TODO: RAG pipeline (embed query -> vector search -> generate answer)
      return res.status(200).json({
        message: "I detected a question, but the answering feature is not built yet! Let's build it next.",
        action: "ask",
        query: intent.query
      });
    }

  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ message: "Something went wrong processing your message." });
  }
}
