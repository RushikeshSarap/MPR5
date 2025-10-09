const express = require('express');
const router = express.Router();

const { queryPinecone } = require('../services/pineconeService');
const { generateReply } = require('../services/mistralService');

router.post('/', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Missing 'message' field" });

    console.log("User message:", message);

    // 1️⃣ Query Pinecone for relevant context
    const contextChunks = await queryPinecone(message);

    // 2️⃣ Generate reply using Mistral
    const reply = await generateReply(message, contextChunks);

    res.json({ reply });
  } catch (err) {
    console.error("Error in /api/chat:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
