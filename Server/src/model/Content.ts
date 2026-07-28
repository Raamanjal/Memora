import { Schema, model, Types } from "mongoose";
import "./Tag.js";

// ─── Content Types ────────────────────────────────────────────────────────────
// "video"   → YouTube links
// "article" → any website/blog URL
// "pdf"     → PDF uploaded via Cloudinary
// "tweet"   → Twitter/X links
// "image"   → image URLs
// "audio"   → audio/podcast links
const contentTypes = ["image", "video", "article", "audio", "tweet", "pdf"] as const;

const contentSchema = new Schema(
  {
    // ── Core fields (existing — unchanged) ──────────────────────────────────
    link:   { type: String, required: true },
    type:   { type: String, enum: contentTypes, required: true },
    title:  { type: String, required: true },
    tags:   [{ type: Types.ObjectId, ref: "Tag" }],
    userId: { type: Types.ObjectId, ref: "User", required: true },

    // ── AI fields (new — all optional so existing documents still work) ─────
    rawText:   { type: String },            // scraped text: transcript / article body / PDF text
    summary:   { type: String },            // 1-line AI-generated summary shown on card
    isIndexed: { type: Boolean, default: false }, // false = pending, true = vectors stored in Atlas
  },
  { timestamps: true } // adds createdAt + updatedAt automatically
);

export const content = model("Content", contentSchema);

