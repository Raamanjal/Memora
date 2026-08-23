import type { Request, Response } from "express";
import { 
  parseUserIntent, 
  detectContentType, 
  generateAnswer, 
  rewriteQuery, 
  type RetrievedChunk 
} from "../services/aiDetector.js";
import { processContent, semanticSearch } from "../services/embeddingService.js";
import { content } from "../model/Content.js";
import { Tag } from "../model/Tag.js";
import { Types } from "mongoose";

export async function chat(req: Request, res: Response) {
  try {
    const { message, history = [] } = req.body;
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
      // User wants to ASK a question (RAG with Contextual Query Rewriting)
      console.log(`[AI Chat] Raw user query: "${intent.query}"`);

      // 1. Context-Aware Query Rewriting & Expansion
      const optimizedQuery = await rewriteQuery(intent.query, history);
      console.log(`[AI Chat] Optimized vector search query: "${optimizedQuery}"`);

      // 2. Semantic Vector Search
      let chunks: RetrievedChunk[] = await semanticSearch(optimizedQuery, userId, 5);
      
      // Fallback: If rewritten query returned no results, try original query
      if (chunks.length === 0 && optimizedQuery !== intent.query) {
        chunks = await semanticSearch(intent.query, userId, 5);
      }

      if (chunks.length === 0) {
        return res.status(200).json({
          message: "I couldn't find any relevant content in your library to answer this question.",
          action: "ask",
          sources: []
        });
      }

      // 3. Fetch metadata for unique content IDs
      const contentIds = Array.from(new Set(chunks.map((c: any) => c.contentId)));
      const contentDocs = await content.find({ _id: { $in: contentIds } }).select("title link type");
      const contentMap = new Map(contentDocs.map((doc) => [doc._id.toString(), doc]));

      // 4. Generate structured answer with conversational history context
      const answer = await generateAnswer(intent.query, chunks, history);

      return res.status(200).json({
        action: "ask",
        answer: answer,
        sources: chunks.map((chunk: any, index: number) => {
          const doc = contentMap.get(chunk.contentId.toString());
          return {
            number: index + 1,
            contentId: chunk.contentId.toString(),
            chunkIndex: chunk.chunkIndex,
            title: doc?.title || `Source ${index + 1}`,
            link: doc?.link || "",
            type: doc?.type || "article",
            score: chunk.score,
            preview: chunk.chunkText.slice(0, 300),
          };
        }),
      });
    }

  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ message: "Something went wrong processing your message." });
  }
}
