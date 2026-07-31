import { GoogleGenAI } from "@google/genai";
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_KEY! });

const GENERATIVE_MODEL = "gemini-3.1-flash-lite";    // Using Pro to bypass daily limits and 404 errors
const EMBEDDING_MODEL = "text-embedding-004";   // For converting text → vectors (768 numbers)

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