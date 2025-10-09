const mistral = require('../services/mistralService');
const vector = require('../services/vectorService');
const db = require('../db/mysql');


async function uploadKnowledge(req, res) {
try {
const { title, content, category, source, metadata } = req.body;
if (!content || !title) return res.status(400).json({ error: 'title and content required' });


// create embedding
const embedding = await mistral.createEmbedding(content);


// upsert into vector store
const vectorId = await vector.upsertVector(content, embedding, { category, source, ...metadata });


// store reference in MySQL
const [result] = await db.execute(
`INSERT INTO knowledge_entries (title, content, category, source, vector_id, created_at) VALUES (?, ?, ?, ?, ?, NOW())`,
[title, content, category || null, source || null, vectorId]
);


res.json({ message: 'Knowledge uploaded', vector_id: vectorId, id: result.insertId });
} catch (err) {
console.error('uploadKnowledge error', err.message || err);
res.status(500).json({ error: 'Internal server error' });
}
}


module.exports = { uploadKnowledge };