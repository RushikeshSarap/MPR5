const mistral = require('../services/mistralService');
const vector = require('../services/vectorService');
const db = require('../db/mysql');


const SYSTEM_PROMPT = `You are an AI admissions assistant for University Thadomal Shahani Engineering College, Bandra West. Answer concisely and cite sources when available.`;


async function handleChat(req, res) {
try {
const { session_id, message } = req.body;
if (!message) return res.status(400).json({ error: 'message is required' });


// 1) create embedding for query
const qEmbedding = await mistral.createEmbedding(message);


// 2) query vector DB for context
const matches = await vector.queryVectors(qEmbedding, 4);
const contextChunks = (matches || []).map(m => ({ text: m.metadata.text, score: m.score, metadata: m.metadata }));


// 3) call Mistral chat with context
const reply = await mistral.createChatCompletion(SYSTEM_PROMPT, message, contextChunks);


// 4) save chat log
await db.execute(
`INSERT INTO chat_logs (session_id, user_message, bot_response, timestamp) VALUES (?, ?, ?, NOW())`,
[session_id || null, message, reply]
);


// 5) return response
res.json({ reply, sources: contextChunks.map(c => c.metadata.source).filter(Boolean) });
} catch (err) {
console.error('chat error', err.message || err);
res.status(500).json({ error: 'Internal server error' });
}
}


module.exports = { handleChat };