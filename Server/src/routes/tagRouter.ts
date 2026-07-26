import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { createTag, deleteTag, getTags, updateTag } from "../controller/tagController.js";
import { createTagSchema, updateTagSchema } from "../schemas/tag.schema.js";

const router = express.Router();

router.get("/", authMiddleware, getTags);
router.post("/", authMiddleware, validate(createTagSchema), createTag);
router.patch("/:tagId", authMiddleware, validate(updateTagSchema), updateTag);
router.delete("/:tagId", authMiddleware, deleteTag);

export default router;
