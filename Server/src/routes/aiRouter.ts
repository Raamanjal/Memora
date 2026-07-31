import { Router } from "express";
import { chat } from "../controller/aiController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();

// POST /api/v1/ai/chat
// The main entry point for the AI chat panel
router.post("/chat", authMiddleware, chat);

export default router;
