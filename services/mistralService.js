const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

// 1️⃣ Get embedding for text
async function getEmbedding(text) {
  // Replace with actual Mistral embedding API
  const response = await axios.post('https://api.mistral.ai/embed', {
    model: 'llama-text-embed-v2',
    input: text,
  }, {
    headers: { 'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}` }
  });

  return response.data.embedding; // float array
}

// 2️⃣ Generate reply
async function generateReply(message, contextChunks) {
  const context = contextChunks.join('\n');
  const prompt = `You are an admission assistant. Use the context below to answer:\n${context}\nQuestion: ${message}`;

  const response = await axios.post('https://api.mistral.ai/generate', {
    model: 'mistral-large',
    prompt,
    max_tokens: 200,
  }, {
    headers: { 'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}` }
  });

  return response.data.output_text; // generated answer
}

module.exports = { getEmbedding, generateReply };
