import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { createContent, deleteContent, getContent, uploadPdfContent } from "../controller/contentController.js";
import { createContentSchema } from "../schemas/content.schema.js";
import { uploadMiddleware } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, validate(createContentSchema), createContent);
router.post("/upload-pdf", authMiddleware, uploadMiddleware.single("pdf"), uploadPdfContent);
router.get("/", authMiddleware, getContent);
router.delete("/:contentId", authMiddleware, deleteContent);

export default router;
