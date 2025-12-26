import "dotenv/config";
import { storeChunksInPinecone } from "../services/pineconeService.js";

(async () => {
  try {
    console.log("Running Pinecone smoke test...");
    const res = await storeChunksInPinecone(
      ["This is a tiny test vector from test-pinecone.js"],
      "smoke-test-doc"
    );
    console.log("Smoke test result:", JSON.stringify(res, null, 2));
  } catch (err) {
    console.error("Smoke test failed:", err && err.message ? err.message : err);
    process.exit(1);
  }
})();
