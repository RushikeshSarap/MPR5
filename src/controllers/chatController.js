import * as mistral from "../services/mistralService.js";
import { queryPinecone } from "../services/pineconeService.js";
import db from "../database/mysql.js";

const SYSTEM_PROMPT = `
You are an AI admissions assistant for Thadomal Shahani Engineering College, Bandra West. 
Answer concisely using only the information provided in the context below (if the information is not sensitive, can use your own knowledge). 
Complete the response in maximum 400 tokens.
Do NOT add any information that is not present in the context and is sensitive . 
If the answer cannot be found in the context, reply: "I'm sorry, but I don't have that information available." 
Cite the source from the context whenever possible.
`;

export async function handleChat(req, res) {
  try {
    const { session_id, message, user_id } = req.body;
    if (!message) return res.status(400).json({ error: "message is required" });

    let activeSessionId = session_id;

    // 1️⃣ If no session_id provided, create a new chat session
    if (!activeSessionId) {
      activeSessionId = crypto.randomUUID();

      await db.execute(
        `INSERT INTO chat_sessions (session_id, user_id) VALUES (?, ?)`,
        [activeSessionId, user_id || null]
      );
    }

    // 2️⃣ Create embedding for query
    const qEmbedding = await mistral.createEmbedding(message);

    // 3️⃣ Query vector DB for context
    const matches = await queryPinecone(qEmbedding, 5);
    const contextChunks = (matches || []).map((m) => ({
      text: m.metadata.text,
      score: m.score,
      metadata: m.metadata,
    }));

    // 4️⃣ Call Mistral chat
    const reply = await mistral.createChatCompletion(
      SYSTEM_PROMPT,
      message,
      contextChunks
    );

    // 5️⃣ Save chat log
    await db.execute(
      `INSERT INTO chat_logs (session_id, user_message, bot_response, timestamp) 
       VALUES (?, ?, ?, NOW())`,
      [activeSessionId, message, reply]
    );

    // 6️⃣ Return response
    res.json({
      session_id: activeSessionId, // return it so frontend stores it
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
