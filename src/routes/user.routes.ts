import { Router } from "express";

import { getUsers } from "../controllers/user.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.get("/", protect, getUsers);

export default router;
