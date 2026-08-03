import type { Request, Response } from "express";
import { Types } from "mongoose";
import { content } from "../model/Content.js";
import { Tag } from "../model/Tag.js";
import { uploadPdfToCloudinary } from "../services/cloudinaryService.js";
import { processContent, deleteContentEmbeddings } from "../services/embeddingService.js";

interface ContentBody {
  link: string;
  title: string;
  type: "image" | "video" | "article" | "audio" | "tweet" | "pdf";
  tags?: string[];
}

export const createContent = async (req: Request<{}, {}, ContentBody>, res: Response) => {
  try {
    const { link, title, type, tags = [] } = req.body;

    if (!req.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const uniqueTagIds = [...new Set(tags)];
    const ownedTagCount = await Tag.countDocuments({
      _id: { $in: uniqueTagIds },
      userId: req.userId,
    });
    if (ownedTagCount !== uniqueTagIds.length) {
      return res.status(400).json({ message: "One or more tags are invalid" });
    }

    const newContent = await content.create({
      link,
      title,
      type,
      userId: req.userId,
      tags: uniqueTagIds.map((tag) => new Types.ObjectId(tag)),
    });

    // Process scraping and AI summary in background
    processContent(newContent._id.toString(), req.userId, link, type)
      .catch((err) => console.error("[Pipeline Error in createContent]:", err));

    return res.status(201).json({
      success: true,
      message: "Content added successfully",
      content: newContent,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const uploadPdfContent = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No PDF file attached." });
    }

    const title = req.body.title?.trim() || req.file.originalname.replace(/\.pdf$/i, "");
    
    // Parse tags if provided as JSON string or array
    let rawTags = req.body.tags;
    let tagList: string[] = [];
    if (typeof rawTags === "string") {
      try {
        tagList = JSON.parse(rawTags);
      } catch {
        tagList = rawTags ? [rawTags] : [];
      }
    } else if (Array.isArray(rawTags)) {
      tagList = rawTags;
    }

    const uniqueTagIds = [...new Set(tagList)].filter((id) => Types.ObjectId.isValid(id));
    if (uniqueTagIds.length > 0) {
      const ownedTagCount = await Tag.countDocuments({
        _id: { $in: uniqueTagIds },
        userId,
      });
      if (ownedTagCount !== uniqueTagIds.length) {
        return res.status(400).json({ message: "One or more tags are invalid" });
      }
    }

    // 1. Upload memory buffer to Cloudinary
    const cloudinaryUrl = await uploadPdfToCloudinary(req.file.buffer, req.file.originalname);

    // 2. Save card in MongoDB
    const newContent = await content.create({
      link: cloudinaryUrl,
      title,
      type: "pdf",
      userId,
      tags: uniqueTagIds.map((tag) => new Types.ObjectId(tag)),
    });

    // 3. Trigger ingestion pipeline in background (scrape text + generate summary)
    processContent(newContent._id.toString(), userId, cloudinaryUrl, "pdf")
      .catch((err) => console.error("[Pipeline Error in uploadPdfContent]:", err));

    return res.status(201).json({
      success: true,
      message: "PDF uploaded and processed successfully!",
      content: newContent,
      url: cloudinaryUrl,
    });
  } catch (error: any) {
    console.error("PDF upload error:", error);
    return res.status(500).json({
      message: error.message || "Failed to upload and process PDF",
    });
  }
};

export const getContent = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userContent = await content
      .find({ userId })
      .populate("tags", "title")
      .lean()
      .exec();

    return res.status(200).json({ userContent });
  } catch (error) {
    console.error("Failed to get content:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteContent = async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (typeof contentId !== "string" || !Types.ObjectId.isValid(contentId)) {
      return res.status(400).json({ message: "Invalid content id" });
    }

    const deletedContent = await content.findOneAndDelete({
      _id: contentId,
      userId: userId,
    });

    if (!deletedContent) {
      return res.status(404).json({ message: "Content not found" });
    }
    // Delete associated embeddings
    await deleteContentEmbeddings(deletedContent._id.toString());
    
    return res.status(200).json({
      message: "Content deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

