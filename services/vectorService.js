// Example implementation for Pinecone. Swap in Qdrant/Chroma as desired.
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();


const PROVIDER = process.env.VECTOR_PROVIDER || 'pinecone';


if (PROVIDER !== 'pinecone') {
console.warn('vectorService implements Pinecone example. Set VECTOR_PROVIDER=pinecone or add provider implementation.');
}


const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_ENV = process.env.PINECONE_ENVIRONMENT; // e.g. 'us-west1-gcp'
const INDEX = process.env.PINECONE_INDEX_NAME;


if (!PINECONE_API_KEY || !PINECONE_ENV || !INDEX) {
console.warn('Pinecone env vars not set.');
}


const PINECONE_BASE = `https://${process.env.PINECONE_INDEX_NAME || INDEX}-${process.env.PINECONE_ENV}.svc.pinecone.io`;


async function upsertVector(text, embedding, metadata = {}) {
const id = uuidv4();
const url = `https://${PINECONE_ENV}.pinecone.io/vectors/upsert`; // NOTE: check Pinecone docs for correct endpoint
// For many Pinecone setups you'd use their SDK; this is illustrative
const payload = { vectors: [{ id, values: embedding, metadata: { text, ...metadata } }] };
// Using axios to call through Pinecone HTTP API is provider-specific.
await axios.post(url, payload, { headers: { 'Api-Key': PINECONE_API_KEY } });
return id;
}


async function queryVectors(embedding, topK = 3) {
const url = `https://${PINECONE_ENV}.pinecone.io/query`;
const payload = { vector: embedding, topK, includeMetadata: true };
const res = await axios.post(url, payload, { headers: { 'Api-Key': PINECONE_API_KEY } });
// adapt to response
return res.data.matches || [];
}


module.exports = { upsertVector, queryVectors };