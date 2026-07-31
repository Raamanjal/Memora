import { content, } from "../model/Content.js";
import { extractContentText } from "./contentScrapper.js";
import { generateSummary } from "./aiDetector.js";
import type { ContentType } from "./aiDetector.js"
// import { chunkWithOverlap } from "./textChunker.js"; // For later (Phase 2 part 2)

/**
 * The Ingestion Pipeline.
 * Runs in the background after a content is saved.
 */
export async function processContent(contentId: string, userId: string, link: string, type: ContentType, userMessage: string = "") {
  try {
    console.log(`[Pipeline] Starting for content ${contentId}...`);

    // 1. Scrape the content
    const rawText = await extractContentText(link, type);
    console.log(`[Pipeline] Scraped ${rawText.length} characters.`);

    // 2. We skip generating the title in the background so we don't overwrite the user's provided title!
    // const title = await generateTitle(userMessage, link, rawText);

    // 3. Generate summary
    const summary = await generateSummary(rawText, type);

    // 4. We skip generating tags in the background to save API tokens! 
    // The initial tags guessed by the Chat Panel are usually good enough.
    // const userTagsDocs = await Tag.find({ userId });
    // const existingTags = userTagsDocs.map(t => t.title);
    // const suggestedTagNames = await generateTags(rawText, existingTags);

    // 5. Save tags in DB (Skipped)
    // const tagIds = [];
    // for (const tagName of suggestedTagNames) {
    //   let tagDoc = await Tag.findOne({ title: tagName, userId });
    //   if (!tagDoc) {
    //     tagDoc = await Tag.create({ title: tagName, userId });
    //   }
    //   tagIds.push(tagDoc._id);
    // }

    // 6. Update the Content document in MongoDB (without overwriting tags/title)
    await content.findByIdAndUpdate(contentId, {
      summary: summary,
      rawText: rawText, // optional, but useful if you want to show it later
      isIndexed: true, // we'll use this later to mean "vectors generated", but for now it means "pipeline finished"
    });

    console.log(`[Pipeline] Finished for content ${contentId}!`);

    // NOTE: In the next step, we will add Chunking and Embedding generation here!

  } catch (error) {
    console.error(`[Pipeline Error] Failed to process content ${contentId}:`, error);
  }
}
