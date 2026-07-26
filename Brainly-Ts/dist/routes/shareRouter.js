import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { shareContent, getSharedContent, getShareStatus } from "../controller/share.js";
const router = express.Router();
router.get("/share", authMiddleware, getShareStatus);
router.post("/share", authMiddleware, shareContent);
router.get("/share/:shareLink", getSharedContent);
export default router;
//# sourceMappingURL=shareRouter.js.map