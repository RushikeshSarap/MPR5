// services/pineconeService.js
import { Pinecone } from '@pinecone-database/pinecone';
import 'dotenv/config';
import { getEmbedding } from './mistralService.js'; // function to get embedding from Mistral

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index(process.env.PINECONE_INDEX_NAME);

// Query Pinecone
export async function queryPinecone(query) {
  const embedding = await getEmbedding(query);
  const result = await index.query({
    vector: embedding,
    topK: 5,
    includeMetadata: true,
  });

  // Return the text of the top results
  return result.matches.map(match => match.metadata.text);
}
