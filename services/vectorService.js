// services/vectorService.js
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config';

const PROVIDER = process.env.VECTOR_PROVIDER || 'pinecone';

if (PROVIDER !== 'pinecone') {
  console.warn(
    'vectorService implements Pinecone example. Set VECTOR_PROVIDER=pinecone or add provider implementation.'
  );
}

const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_ENV = process.env.PINECONE_ENVIRONMENT; // e.g. 'us-west1-gcp'
const INDEX = process.env.PINECONE_INDEX_NAME;

if (!PINECONE_API_KEY || !PINECONE_ENV || !INDEX) {
  console.warn('Pinecone env vars not set.');
}

const PINECONE_BASE = `https://${INDEX}-${PINECONE_ENV}.svc.pinecone.io`;

// Upsert a vector into Pinecone
export async function upsertVector(text, embedding, metadata = {}) {
  const id = uuidv4();
  const url = `https://${PINECONE_ENV}.pinecone.io/vectors/upsert`; // Check Pinecone docs for correct endpoint
  const payload = {
    vectors: [{ id, values: embedding, metadata: { text, ...metadata } }],
  };
  await axios.post(url, payload, { headers: { 'Api-Key': PINECONE_API_KEY } });
  return id;
}

// Query Pinecone vectors
export async function queryVectors(embedding, topK = 3) {
  const url = `https://${PINECONE_ENV}.pinecone.io/query`;
  const payload = { vector: embedding, topK, includeMetadata: true };
  const res = await axios.post(url, payload, { headers: { 'Api-Key': PINECONE_API_KEY } });
  return res.data.matches || [];
}
