// services/pineconeService.js
import { Pinecone } from "@pinecone-database/pinecone";
import "dotenv/config";
import crypto from "crypto";
import { getEmbedding } from "./mistralService.js"; // function that gets vector from text

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index(process.env.PINECONE_INDEX_NAME);

/**
 * Upsert text and metadata into Pinecone vector database
 * @param {string} text
 * @param {object} metadata
 */
export async function upsertText(text, metadata = {}) {
  try {
    const embedding = await getEmbedding(text); // returns float array

    const vector = {
      id: crypto.randomUUID(), // unique ID
      values: embedding,
      metadata: { ...metadata, text },
    };

    await index.upsert({
      vectors: [vector],
      namespace: "admission", // optional
    });

    console.log("✅ Text upserted to Pinecone");
  } catch (err) {
    console.error("❌ Error upserting text to Pinecone:", err);
  }
}
