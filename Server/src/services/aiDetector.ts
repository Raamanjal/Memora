import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_KEY! });

const GENERATIVE_MODEL = "gemini-3.1-flash-lite";    // Using Pro to bypass daily limits and 404 errors
const EMBEDDING_MODEL = "gemini-embedding-001";   // For converting text → vectors (768 numbers)

//TYPES
export type ContentType = "image" | "video" | "article" | "audio" | "tweet" | "pdf";

// Valid types list — used to validate AI's response
const VALID_TYPES: ContentType[] = ["image", "video", "article", "audio", "tweet", "pdf"];



export async function detectContentType(url: string, message: string = ""): Promise<ContentType> {
  try {
    const response = await ai.models.generateContent({
      model: GENERATIVE_MODEL,
      contents: `You are a content type classifier. Given a URL and an optional user message, determine what type of content this is.

Respond with EXACTLY ONE of these types (nothing else):
image, video, article, audio, tweet, pdf

URL: ${url}
User message: ${message || "(no message provided)"}

Rules:
- YouTube, Vimeo, Dailymotion links or user mentions 'video" → video
- Twitter/X links or user mentions 'tweet" → tweet
- Google Drive PDFs, .pdf links, or user mentions "pdf" → pdf
- Spotify, podcast links, .mp3 files or user mentions 'audio" → audio
- Image URLs (.png, .jpg, etc) or image hosting sites or user mentions "image" → image
- Everything else (blogs, articles, websites) or user mentions "article" or "website/site" → article
- If the user explicitly says the type (e.g. "save this video"), trust them

Respond with only the type, one word, lowercase:`,
    });

    // Clean up AI response and validate it
    const detected = response.text?.trim().toLowerCase() as ContentType;

    // If AI returned a valid type, use it. Otherwise default to "article"
    if (VALID_TYPES.includes(detected)) {
      return detected;
    }

    return "article";
  } catch (error) {
    // If AI call fails, fall back to "article" (safest default)
    console.error("Content type detection failed, defaulting to article:", error);
    return "article";
  }
}

// ─── Fn 2: Parse User Intent ────────────────────────────────────────────────────
//

interface Save {
  action: "save";
  url: string;
  message: string;
}

interface Ask {
  action: "ask";
  query: string;
}

export type UserIntent = Save | Ask;

import { Type } from "@google/genai";

export function parseUserIntentRegexBackup(message: string): UserIntent {
  // Try to find a URL in the message
  const urlRegex = /https?:\/\/[^\s]+/gi;
  const urls = message.match(urlRegex);

  // No URL found → user is asking a question
  if (!urls || urls.length === 0) {
    return { action: "ask", query: message };
  }

  return {
    action: "save",
    url: urls[0]!,
    message: message,
  };
}

// ─── Fn 2: Parse User Intent (using Tool Calling!) ──────────────────────────────
export async function parseUserIntent(message: string): Promise<UserIntent & { type?: ContentType, suggestedTitle?: string, tags?: string[] }> {
  try {
    const response = await ai.models.generateContent({
      model: GENERATIVE_MODEL,
      contents: message,
      config: {
        tools: [{
          functionDeclarations: [{
            name: "save_content",
            description: "Saves a URL or link that the user wants to keep for later. Call this when the user shares a link.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                url: { type: Type.STRING, description: "The exact URL the user wants to save" },
                contentType: {
                  type: Type.STRING,
                  description: "The type of content. Must be one of: video, article, pdf, tweet, audio, image. Guess based on the URL or what the user says.",
                },
                title: { type: Type.STRING, description: "ONLY extract if the user explicitly provides a title (e.g. 'with the title X'). Do NOT guess or generate a title based on the URL. If the user didn't provide one, leave undefined." },
                tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "ONLY extract if the user explicitly specifies tags. Do NOT guess or generate tags. If the user didn't provide tags, leave undefined." }
              },
              required: ["url", "contentType"]
            }
          }]
        }]
      }
    });

    // Check if Gemini decided to call our tool!
    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      if (call && call.name === "save_content") {
        const args = call.args as any;
        return {
          action: "save",
          url: args?.url,
          message: message,
          ...(args?.contentType && { type: args.contentType as ContentType }),
          ...(args?.title && { suggestedTitle: args.title }),
          ...(args?.tags && { tags: args.tags as string[] })
        };
      }
    }

    // If it didn't call the tool, it's a regular question
    return { action: "ask", query: message };
  } catch (error) {
    console.error("Tool calling failed, falling back to regex:", error);
    return parseUserIntentRegexBackup(message);
  }
}

// ─── Fn 4: Generate Summary ─────────────────────────────────────────────────────
// Generates a 1-2 sentence summary for a piece of scraped content.
// This is used for displaying content cards in the UI.
export async function generateSummary(text: string, contentType: ContentType): Promise<string> {
  if (!text || text.trim() === "") {
    return "No content available to summarize.";
  }

  // Truncate to ~1000 words for summary to save free tier API tokens
  const words = text.split(/\s+/);
  const truncated = words.length > 1000 ? words.slice(0, 1000).join(" ") + "..." : text;

  // Content-type-specific prompt hints
  const typeHints: Record<ContentType, string> = {
    article: "This is a web article or blog post.",
    video: "This is a YouTube video transcript.",
    pdf: "This is text extracted from a PDF document.",
    tweet: "This is content from a tweet or Twitter thread.",
    image: "This is a description or caption of an image.",
    audio: "This is a transcript from an audio recording or podcast.",
  };

  try {
    const response = await ai.models.generateContent({
      model: GENERATIVE_MODEL,
      contents: `You are a summarization assistant for a personal knowledge management app called "Brainly".
${typeHints[contentType]}

Summarize the following content in 1-2 concise sentences.
- Focus on the key takeaway or main point.
- Be specific, not generic (avoid "this article discusses...").
- Write as if it will appear on a small card in a dashboard.

Content:
${truncated}`,
    });

    return response.text?.trim() ?? "Summary could not be generated.";
  } catch (error) {
    console.error("Summary generation failed:", error);
    return "Summary could not be generated.";
  }
}


export async function generateEmbedding(text:string): Promise<number[]> {
  const response = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
    config: {
    outputDimensionality: 768,
  },
  })
   const embedding = response.embeddings?.[0]?.values;
   if(!embedding || embedding.length !== 768){
    throw new Error("Embedding generation failed or returned unexpected length.");
   }
   return embedding;
}

export interface RetrievedChunk {
  contentId: string;
  chunkText: string;
  chunkIndex: number;
  score?: number | undefined;
}

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

/**
 * ─── Context-Aware Query Rewriting & Expansion ────────────────────────────────
 * Transforms conversational user questions into dense, keyword-rich queries
 * optimized for vector search, taking previous conversation turns into account.
 */
export async function rewriteQuery(userQuery: string, history: ChatMessage[] = []): Promise<string> {
  if (!userQuery || userQuery.trim().length === 0) return userQuery;

  // Format recent chat history if available
  const recentHistory = history
    .slice(-4)
    .map((msg) => `${msg.role === "user" ? "User" : "AI Assistant"}: ${msg.text.slice(0, 250)}`)
    .join("\n");

  try {
    const response = await ai.models.generateContent({
      model: GENERATIVE_MODEL,
      contents: `You are an expert AI search optimizer for a personal knowledge assistant.
Given the conversation history and a user's latest follow-up question, rewrite it into a single, clear search query optimized for semantic vector search in their personal library.

Rules:
- Replace ambiguous pronouns ("it", "that", "this", "they", "the previous tool") with the specific subject discussed in the conversation history.
- Remove conversational filler (e.g. "tell me more about", "can you check if", "show notes on").
- Include relevant technical keywords and synonyms.
- Keep it concise (maximum 15 words).
- Output ONLY the rewritten search query with NO extra commentary or quotation marks.

Conversation History:
${recentHistory || "No previous history."}

User's Question: "${userQuery}"
Optimized Query:`,
    });

    const rewritten = response.text?.trim().replace(/^["']|["']$/g, "");
    if (rewritten && rewritten.length > 2) {
      return rewritten;
    }
    return userQuery;
  } catch (error) {
    console.error("Query rewriting failed, falling back to original:", error);
    return userQuery;
  }
}

/**
 * ─── Conversational Answer Generation ─────────────────────────────────────────
 * Generates an articulate, structured, and comprehensive answer using Markdown
 * with clean inline source citations [1], [2] while maintaining conversational continuity.
 */
export async function generateAnswer(
  query: string,
  chunks: RetrievedChunk[],
  history: ChatMessage[] = []
): Promise<string> {
  const context = chunks
    .map((chunk, index) => `--- [Source ${index + 1}] ---\n${chunk.chunkText}`)
    .join("\n\n");

  const conversationHistory = history
    .slice(-6)
    .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.text}`)
    .join("\n\n");

  const response = await ai.models.generateContent({
    model: GENERATIVE_MODEL,
    contents: `You are Memora AI, an intelligent, articulate personal knowledge assistant.

Your task is to answer the user's question accurately and insightfully based on the retrieved context from their personal library, keeping the conversation history in mind.

Instructions:
1. **Structure & Formatting**:
   - Use clear GitHub-flavored Markdown formatting.
   - Use bold text (**concept**) for emphasis on important terms or takeaways.
   - Use structured bullet lists (- ) or numbered steps (1. ) where appropriate.
   - If providing code, use fenced code blocks with the exact language identifier (e.g. \`\`\`typescript ... \`\`\`).
2. **Citations**:
   - Cite relevant facts with simple brackets like [1] or [2] immediately following the cited statement or paragraph.
   - Match the citation numbers directly to the provided Source numbers.
3. **Conversational Continuity**:
   - If the user is asking a follow-up to a previous topic, answer smoothly and refer back to previous context naturally.
4. **Honesty**:
   - If the provided context does not contain enough information to answer the question, state what is known from the context and clearly clarify what is missing.

${conversationHistory ? `Conversation History:\n${conversationHistory}\n\n` : ""}Retrieved Context from Saved Library:
${context}

User Question:
${query}`,
  });

  return response.text?.trim() ?? "I could not generate an answer based on your saved content.";
}