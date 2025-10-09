const { Pinecone } = require('@pinecone-database/pinecone');
const dotenv = require('dotenv');
const { getEmbedding } = require('./mistralService'); // function to get embedding from Mistral

dotenv.config();

const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pc.index(process.env.PINECONE_INDEX_NAME);

// Query Pinecone
async function queryPinecone(query) {
  const embedding = await getEmbedding(query);
  const result = await index.query({
    vector: embedding,
    topK: 5,
    includeMetadata: true,
  });

  // Return the text of the top results
  return result.matches.map(match => match.metadata.text);
}

module.exports = { queryPinecone };
