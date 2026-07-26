import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { createContent, deleteContent, getContent } from "../controller/contentController.js";
import { createContentSchema } from "../schemas/content.schema.js";
const router = express.Router();

router.post("/", authMiddleware, validate(createContentSchema), createContent);
router.get("/", authMiddleware, getContent);
router.delete("/:contentId", authMiddleware, deleteContent);

export default router;
