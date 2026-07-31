import type { Request, Response } from "express";
import { Types } from "mongoose";
import { content } from "../model/Content.js";
import { Tag } from "../model/Tag.js";

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

    await content.create({
      link,
      title,
      type,
      userId: req.userId,
      tags: uniqueTagIds.map((tag) => new Types.ObjectId(tag)),
    });

    return res.status(201).json({
      success: true,
      message: "Content added successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
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

    return res.status(200).json({
      message: "Content deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

