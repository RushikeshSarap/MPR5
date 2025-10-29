import * as mistral from "../services/mistralService.js";
import { queryPinecone } from "../services/pineconeService.js";
import db from "../db/mysql.js";

const SYSTEM_PROMPT = `
You are an AI admissions assistant for Thadomal Shahani Engineering College, Bandra West. 
Answer concisely using only the information provided in the context below (if the information is not sensitive, can use your own knowledge). 
Do NOT add any information that is not present in the context and is sensitive . 
If the answer cannot be found in the context, reply: "I'm sorry, but I don't have that information available." 
Cite the source from the context whenever possible.
`;

export async function handleChat(req, res) {
  try {
    const { session_id, message } = req.body;
    if (!message) return res.status(400).json({ error: "message is required" });

    // 1️⃣ create embedding for query
    const qEmbedding = await mistral.createEmbedding(message);

    // 2️⃣ query vector DB for context
    const matches = await queryPinecone(qEmbedding, 4);
    const contextChunks = (matches || []).map((m) => ({
      text: m.metadata.text,
      score: m.score,
      metadata: m.metadata,
    }));

    // // 🔹 Debug: log retrieved chunks
    // console.log("📚 Retrieved context chunks:");
    // contextChunks.forEach((c, i) => console.log(`Chunk ${i + 1}:`, c.text.slice(0, 200), "..."));

    // 3️⃣ call Mistral chat with SYSTEM_PROMPT + context
    // Pass objects directly; generateReply safely extracts text
    const reply = await mistral.createChatCompletion(
      SYSTEM_PROMPT,
      message,
      contextChunks
    );

    // 4️⃣ save chat log
    await db.execute(
      `INSERT INTO chat_logs (session_id, user_message, bot_response, timestamp) VALUES (?, ?, ?, NOW())`,
      [session_id || null, message, reply]
    );

    // 5️⃣ return response with optional debug info
    res.json({
      reply,
      sources: contextChunks.map((c) => c.metadata.source).filter(Boolean),
      debug: {
        message,
        contextChunks,
      },
    });
  } catch (err) {
    console.error("chat error", err.message || err);
    res.status(500).json({ error: "Internal server error" });
  }
}
