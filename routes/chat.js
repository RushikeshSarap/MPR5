// routes/chat.js
import express from 'express';
const router = express.Router();

import { queryPinecone } from '../services/pineconeService.js';
import { generateReply } from '../services/mistralService.js';

router.post("/", async (req, res) => {
  try {
    const { message, contextChunks = [] } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'message' in request body." });
    }

    // Call the service to generate reply
    const reply = await generateReply(message, contextChunks);

    res.json({ reply });
  } catch (err) {
    console.error("Error in /api/chat:", err.message);
    res.status(500).json({
      error: "Mistral reply error",
      details: err.message || err,
    });
  }
});

export default router;
