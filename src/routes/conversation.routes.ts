import { Router } from "express";

import {
  createPrivateConversation,
  getConversations,
} from "../controllers/conversation.controller";

import { protect } from "../middleware/auth.middleware";

const router = Router();

router.get("/", protect, getConversations);

router.post("/private", protect, createPrivateConversation);

export default router;
