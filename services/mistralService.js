// services/mistralService.js
import axios from "axios";
import Bottleneck from "bottleneck";
import 'dotenv/config';

const { MISTRAL_API_KEY, MISTRAL_EMBED_MODEL, MISTRAL_CHAT_MODEL } = process.env;

if (!MISTRAL_API_KEY || !MISTRAL_EMBED_MODEL) {
  throw new Error(
    "Missing Mistral API environment variables. Check .env for MISTRAL_API_KEY and MISTRAL_EMBED_MODEL"
  );
}

/* ----------------------- 🧠 RATE LIMITERS ----------------------- */
// 1 embedding request every 3 seconds (to stay well below free-tier cap)
const embedLimiter = new Bottleneck({
  minTime: 3000, // 3 seconds between requests
  maxConcurrent: 1,
});

// 1 chat request every 2 seconds (safe for replies)
const chatLimiter = new Bottleneck({
  minTime: 2000,
  maxConcurrent: 1,
});

/* ----------------------- ⚡ EMBEDDINGS ----------------------- */
export const getEmbedding = embedLimiter.wrap(async (text) => {
  try {
    const response = await axios.post(
      "https://api.mistral.ai/v1/embeddings",
      {
        model: MISTRAL_EMBED_MODEL,
        input: text,
      },
      {
        headers: {
          Authorization: `Bearer ${MISTRAL_API_KEY}`,
        },
        timeout: 60000,
      }
    );

    if (!response.data?.data?.[0]?.embedding) {
      throw new Error("Invalid embedding response: " + JSON.stringify(response.data));
    }

    return response.data.data[0].embedding;
  } catch (err) {
    const details = err.response?.data || err.message || err;

    // 🔁 Retry logic: if capacity exceeded, wait and retry
    if (JSON.stringify(details).includes("service_tier_capacity_exceeded")) {
      console.warn("⚠️ Mistral capacity exceeded — retrying in 5 seconds...");
      await new Promise((res) => setTimeout(res, 5000));
      return getEmbedding(text);
    }

    throw new Error("Mistral embedding error: " + JSON.stringify(details));
  }
});

/* ----------------------- 💬 CHAT COMPLETIONS ----------------------- */
export const generateReply = chatLimiter.wrap(async (message, contextChunks = []) => {
  if (!MISTRAL_CHAT_MODEL) {
    throw new Error("Missing Mistral chat model env variable: MISTRAL_CHAT_MODEL");
  }

  try {
    const response = await axios.post(
      "https://api.mistral.ai/v1/chat/completions",
      {
        model: MISTRAL_CHAT_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are an AI assistant that helps with college admission queries. Be concise and factual.",
          },
          {
            role: "user",
            content: `${contextChunks.join("\n")}\nUser: ${message}`,
          },
        ],
        max_tokens: 200,
      },
      {
        headers: {
          Authorization: `Bearer ${MISTRAL_API_KEY}`,
        },
        timeout: 60000,
      }
    );

    return (
      response.data?.choices?.[0]?.message?.content?.trim() ||
      "No response from Mistral"
    );
  } catch (err) {
    const details = err.response?.data || err.message || err;

    // 🔁 Retry logic for chat as well
    if (JSON.stringify(details).includes("service_tier_capacity_exceeded")) {
      console.warn("⚠️ Mistral chat capacity exceeded — retrying in 5 seconds...");
      await new Promise((res) => setTimeout(res, 5000));
      return generateReply(message, contextChunks);
    }

    throw new Error("Mistral reply error: " + JSON.stringify(details));
  }
});
