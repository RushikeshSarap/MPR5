import axios from "axios";
import "dotenv/config";

/**
 * 1️⃣ Get embedding for a text using Mistral API
 */
async function getEmbedding(text) {
  try {
    const response = await axios.post(
      "https://api.mistral.ai/v1/embeddings",
      {
        model: "mistral-embed",
        input: text,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.data.data[0].embedding;
  } catch (err) {
    console.error("❌ Embedding error:", err.response?.data || err.message);
    throw err;
  }
}

/**
 * 2️⃣ Generate a reply using Mistral chat model
 * Accepts contextChunks as an array of objects or strings.
 */
async function generateReply(systemPrompt, userMessage, contextChunks) {
  // Ensure contextChunks is an array of strings
  const contextText = (contextChunks || [])
    .map((c) => (typeof c === "string" ? c : c.text || ""))
    .join("\n\n");

  const prompt = `${systemPrompt}\n\nContext:\n${contextText}\n\nUser: ${userMessage}\nAssistant:`;

  try {
    const response = await axios.post(
      "https://api.mistral.ai/v1/chat/completions",
      {
        model: "mistral-large-latest",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful, polite admission assistant for Thadomal Shahani Engineering College, Bandra West. Try to complete the response in maximum 400 tokens",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 400,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.MISTRAL_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (err) {
    console.error(
      "❌ Chat generation error:",
      err.response?.data || err.message
    );
    throw err;
  }
}

export { getEmbedding, generateReply };

// Aliases for compatibility
export const createEmbedding = getEmbedding;
export const createChatCompletion = generateReply;
