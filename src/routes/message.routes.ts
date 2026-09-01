import { Router } from "express";

import { createMessage, getMessages } from "../controllers/message.controller";

import { protect } from "../middleware/auth.middleware";

const router = Router();

router.get("/:conversationId", protect, getMessages);

router.post("/:conversationId", protect, createMessage);

export default router;
