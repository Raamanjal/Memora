import { Types } from "mongoose";
import { content } from "../model/Content.js";
import { Tag } from "../model/Tag.js";
function isValidTagId(tagId) {
    return Types.ObjectId.isValid(tagId);
}
export const createTag = async (req, res) => {
    if (!req.userId)
        return res.status(401).json({ message: "Unauthorized" });
    try {
        const title = req.body.title.trim();
        const existingTag = await Tag.findOne({ userId: req.userId, title });
        if (existingTag)
            return res.status(200).json({ tag: existingTag });
        const tag = await Tag.create({ title, userId: req.userId });
        return res.status(201).json({ tag });
    }
    catch (error) {
        console.error("Failed to create tag:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
export const getTags = async (req, res) => {
    if (!req.userId)
        return res.status(401).json({ message: "Unauthorized" });
    try {
        const tags = await Tag.find({ userId: req.userId }).sort({ title: 1 }).lean();
        return res.status(200).json({ tags });
    }
    catch (error) {
        console.error("Failed to get tags:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
export const updateTag = async (req, res) => {
    const { tagId } = req.params;
    if (!req.userId)
        return res.status(401).json({ message: "Unauthorized" });
    if (typeof tagId !== "string" || !isValidTagId(tagId))
        return res.status(400).json({ message: "Invalid tag id" });
    try {
        const tag = await Tag.findOneAndUpdate({ _id: tagId, userId: req.userId }, { title: req.body.title.trim() }, { new: true, runValidators: true });
        if (!tag)
            return res.status(404).json({ message: "Tag not found" });
        return res.status(200).json({ tag });
    }
    catch (error) {
        console.error("Failed to update tag:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
export const deleteTag = async (req, res) => {
    const { tagId } = req.params;
    if (!req.userId)
        return res.status(401).json({ message: "Unauthorized" });
    if (typeof tagId !== "string" || !isValidTagId(tagId))
        return res.status(400).json({ message: "Invalid tag id" });
    try {
        const tag = await Tag.findOneAndDelete({ _id: tagId, userId: req.userId });
        if (!tag)
            return res.status(404).json({ message: "Tag not found" });
        await content.updateMany({ userId: req.userId }, { $pull: { tags: tag._id } });
        return res.status(200).json({ message: "Tag deleted successfully" });
    }
    catch (error) {
        console.error("Failed to delete tag:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
//# sourceMappingURL=tagController.js.map