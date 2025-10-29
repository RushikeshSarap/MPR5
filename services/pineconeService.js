import pineconePkg from "@pinecone-database/pinecone";
const { Pinecone } = pineconePkg;
import "dotenv/config";
import { getEmbedding } from "./mistralService.js";

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_ENV =
  process.env.PINECONE_ENVIRONMENT || process.env.PINECONE_ENV;
const PINECONE_INDEX = process.env.PINECONE_INDEX_NAME;

let client = null;
let index = null;

async function getIndex() {
  if (index) return index;
  if (!PINECONE_API_KEY || !PINECONE_ENV || !PINECONE_INDEX) {
    throw new Error(
      "Pinecone env vars missing. Set PINECONE_API_KEY, PINECONE_ENVIRONMENT and PINECONE_INDEX_NAME."
    );
  }

  // Construct the Pinecone client using the SDK's Pinecone class.
  // The SDK accepts `apiKey` (and optionally `controllerHostUrl`).
  // Do not pass `environment` here — that property is not accepted by this SDK build.
  const clientConfig = { apiKey: PINECONE_API_KEY };
  if (process.env.PINECONE_CONTROLLER_HOST) {
    clientConfig.controllerHostUrl = process.env.PINECONE_CONTROLLER_HOST;
  }
  client = new Pinecone(clientConfig);
  // Target the index for data operations
  index = client.index(PINECONE_INDEX);
  return index;
}

// Insert vectors into Pinecone
export async function insertVectors(vectors) {
  const idx = await getIndex();
  try {
    if (!Array.isArray(vectors)) {
      throw new Error("vectors must be an array");
    }

    const formattedVectors = vectors.map((v) => {
      if (!v.id || !v.values || !Array.isArray(v.values)) {
        throw new Error(`Invalid vector format: ${JSON.stringify(v)}`);
      }
      return {
        id: String(v.id),
        metadata: v.metadata || {},
        values: Array.from(v.values),
      };
    });

    console.log(`Upserting ${formattedVectors.length} vectors to Pinecone`);
    // The SDK expects an array of records for upsert
    const res = await idx.upsert(formattedVectors);
    console.log("Vector upsert successful");
    return res;
  } catch (err) {
    console.error(
      "Error upserting vectors:",
      err && err.message ? err.message : err
    );
    throw err;
  }
}

// Query vectors from Pinecone
export async function queryVectors(embedding, topK = 5) {
  const idx = await getIndex();
  try {
    if (!Array.isArray(embedding))
      throw new Error("embedding must be an array");
    const result = await idx.query({
      vector: embedding,
      topK,
      includeMetadata: true,
    });
    console.log(result.matches || []);
    return result.matches || [];
  } catch (err) {
    console.error(
      "Error querying vectors:",
      err && err.message ? err.message : err
    );
    throw err;
  }
}

// Store PDF/text chunks in Pinecone
export async function storeChunksInPinecone(chunks, documentId = "pdf") {
  try {
    if (!Array.isArray(chunks))
      throw new Error("chunks must be an array of strings");
    const vectors = [];

    for (let i = 0; i < chunks.length; i++) {
      const text = String(chunks[i] || "");
      const embedding = await getEmbedding(text);
      if (!Array.isArray(embedding))
        throw new Error("Invalid embedding returned from getEmbedding");

      vectors.push({
        id: `${documentId}-chunk-${i + 1}`,
        values: embedding,
        metadata: { text },
      });
    }

    if (vectors.length === 0) return { success: true, totalVectors: 0 };

    console.log("First vector to upsert:", JSON.stringify(vectors[0], null, 2));
    const res = await insertVectors(vectors);
    return {
      success: true,
      totalVectors: vectors.length,
      pineconeResponse: res,
    };
  } catch (error) {
    console.error(
      "Pinecone upsert error details:",
      error && error.message ? error.message : error
    );
    throw error;
  }
}

// Backwards-compatible alias expected by some routes
export const queryPinecone = queryVectors;
