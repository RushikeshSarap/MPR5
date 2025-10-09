// Make sure your package.json has "type": "module" for ES module support
// OR run with node --experimental-modules if older Node

import fs from "fs";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";
import { Pinecone } from "@pinecone-database/pinecone";

dotenv.config();

// ====== ENV VARIABLES ======
const {
  MISTRAL_API_KEY,
  MISTRAL_EMBED_MODEL,
  PINECONE_API_KEY,
  PINECONE_INDEX_NAME,
  PINECONE_REGION
} = process.env;

if (!MISTRAL_API_KEY || !MISTRAL_EMBED_MODEL || !PINECONE_API_KEY || !PINECONE_INDEX_NAME) {
  console.error("❌ Missing required env vars. Check .env for MISTRAL_API_KEY, MISTRAL_EMBED_MODEL, PINECONE_API_KEY, PINECONE_INDEX_NAME");
  process.exit(1);
}

// Initialize Pinecone client
const pc = new Pinecone({ apiKey: PINECONE_API_KEY });
const index = pc.index(PINECONE_INDEX_NAME);

// ====== HELPER FUNCTIONS ======
function chunkText(text, maxLen = 800) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + maxLen, text.length);
    const newline = text.lastIndexOf('\n', end);
    const dot = text.lastIndexOf('. ', end);
    const splitAt = Math.max(newline, dot);
    if (splitAt > start + Math.floor(maxLen * 0.5)) end = splitAt + 1;
    const part = text.slice(start, end).trim();
    if (part) chunks.push(part);
    start = end;
  }
  return chunks;
}

async function embedText(text) {
  try {
    const url = "https://api.mistral.ai/v1/embeddings";
    const res = await axios.post(url, {
      model: MISTRAL_EMBED_MODEL,
      input: text
    }, {
      headers: { Authorization: `Bearer ${MISTRAL_API_KEY}` },
      timeout: 30000
    });

    if (!res.data?.data?.[0]?.embedding) {
      throw new Error("Unexpected embedding response: " + JSON.stringify(res.data).slice(0, 500));
    }

    return res.data.data[0].embedding;
  } catch (err) {
    const details = err.response?.data || err.message || err;
    throw new Error("Embedding error: " + JSON.stringify(details));
  }
}

async function upsertVectors(vectors) {
  try {
    // SDK call
    const res = await index.upsert(vectors);
    return res;
  } catch (err) {
    const details = err.response?.data || err.message || err;
    throw new Error("Pinecone upsert error: " + JSON.stringify(details));
  }
}

// ====== MAIN FUNCTION ======
async function run() {
  try {
    const dataPath = path.resolve("data", "admission_info.json");
    if (!fs.existsSync(dataPath)) {
      console.error("❌ Data file not found:", dataPath);
      process.exit(1);
    }

    const raw = fs.readFileSync(dataPath, "utf8");
    const items = JSON.parse(raw);
    if (!Array.isArray(items) || items.length === 0) {
      console.error("❌ Data file must be a non-empty array.");
      process.exit(1);
    }

    console.log(`Found ${items.length} items to upsert.`);

    const allVectors = [];

    for (const item of items) {
      if (!item.id || !item.text) {
        console.warn("Skipping item without id or text:", item);
        continue;
      }

      const chunks = chunkText(item.text, 800);
      console.log(`Item ${item.id}: split into ${chunks.length} chunk(s).`);

      for (let i = 0; i < chunks.length; i++) {
        const chunkTextStr = chunks[i];
        console.log(`Embedding chunk ${i + 1}/${chunks.length} for ${item.id} (len=${chunkTextStr.length})...`);
        const embedding = await embedText(chunkTextStr);
        console.log(`  -> embedding length: ${embedding.length}`);

        const vectorId = `${item.id}::${i}`;
        const metadata = { ...item.metadata, source_id: item.id, chunk_index: i, text: chunkTextStr };

        allVectors.push({ id: vectorId, values: embedding, metadata });

        // Batch upsert every 50 vectors
        if (allVectors.length >= 50) {
          console.log(`Upserting batch of ${allVectors.length} vectors...`);
          const upsertRes = await upsertVectors(allVectors);
          console.log("Upsert response:", upsertRes);
          allVectors.length = 0;
        }
      }
    }

    if (allVectors.length > 0) {
      console.log(`Upserting final batch of ${allVectors.length} vectors...`);
      const upsertRes = await upsertVectors(allVectors);
      console.log("Upsert response:", upsertRes);
    }

    console.log("✅ All data uploaded to Pinecone successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Script failed:", err.message || err);
    console.error(err.stack || "");
    process.exit(1);
  }
}

run();
