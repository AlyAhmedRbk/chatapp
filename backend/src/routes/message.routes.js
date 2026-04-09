import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { getMessages } from "../controllers/message.controller.js";

const router = express.Router();

router.get("/:receiverId", authMiddleware, getMessages);

export default router;