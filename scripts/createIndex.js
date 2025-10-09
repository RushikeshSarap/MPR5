// import { Pinecone } from "@pinecone-database/pinecone";
// import dotenv from "dotenv";
// dotenv.config(); // to load .env variables

// const run = async () => {
//   try {
//     const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

//     const index = pc.index(process.env.PINECONE_INDEX_NAME);
//     await pc.createIndexForModel({
//       name: index,
//       cloud: "aws",
//       region: "us-east-1",
//       embed: {
//         model: "llama-text-embed-v2",
//         fieldMap: { text: "chunk_text" },
//       },
//       waitUntilReady: true,
//     });

//     console.log(`✅ Index '${index}' created successfully.`);
//   } catch (err) {
//     console.error("❌ Error creating Pinecone index:", err);
//   }
// };

// run();
import { Pinecone } from "@pinecone-database/pinecone";
import dotenv from "dotenv";
import { getEmbedding } from "./mistralService.js"; // function that gets vector from text

dotenv.config();

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index(process.env.PINECONE_INDEX_NAME);

export async function upsertText(text, metadata = {}) {
  const embedding = await getEmbedding(text); // returns a float array
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
}

run();