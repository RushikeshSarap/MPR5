import * as mistral from "../services/mistralService.js";
import * as vector from "../services/vectorService.js";
import db from "../db/mysql.js";

export async function uploadKnowledge(req, res) {
  try {
    const { title, content, category, source, metadata } = req.body;
    if (!content || !title)
      return res.status(400).json({ error: "title and content required" });

    console.log("Creating embedding for content length:", content.length);
    // 1️⃣ create embedding
    const embedding = await mistral.createEmbedding(content);

    if (!embedding || !Array.isArray(embedding)) {
      console.error("Invalid embedding format:", embedding);
      return res
        .status(500)
        .json({ error: "Failed to create valid embedding" });
    }

    console.log("Upserting vector with embedding length:", embedding.length);
    const combinedMetadata = {
      title,
      category: category || "general",
      source: source || "manual",
      ...metadata,
    };

    // 2️⃣ upsert into vector store
    const vectorId = await vector.upsertVector(
      content,
      embedding,
      combinedMetadata
    );
    // console.log('Vector upserted with ID:', vectorId);

    // 3️⃣ store reference in MySQL
    const [result] = await db.execute(
      `INSERT INTO knowledge_entries (title, content, category, source, vector_id, created_at) VALUES (?, ?, ?, ?, ?, NOW())`,
      [title, content, category || null, source || null, vectorId]
    );

    // 4️⃣ return response
    res.json({
      message: "Knowledge uploaded",
      vector_id: vectorId,
      id: result.insertId,
    });
  } catch (err) {
    console.error("uploadKnowledge error", err.message || err);
    res.status(500).json({ error: "Internal server error" });
  }
}
