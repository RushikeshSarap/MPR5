// routes/chat.js
import express from "express";
import { handleChat } from "../controllers/chatController.js";

const router = express.Router();

// Simply delegate to controller
router.post("/", handleChat);

export default router;
