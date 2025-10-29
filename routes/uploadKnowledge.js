// routes/uploadKnowledge.js
import express from "express";
import { uploadKnowledge } from "../controllers/knowledgeController.js";

const router = express.Router();

// POST route to upload knowledge
router.post("/upload", uploadKnowledge);

export default router;
