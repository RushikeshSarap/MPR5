# AI Admission Chatbot Backend


This repository contains a minimal backend skeleton for an AI-powered admission assistant widget using Mistral for embeddings/chat and a vector DB (Pinecone example).


## Setup
1. Copy `.env.example` to `.env` and fill values.
2. `npm install`
3. Create MySQL database using `sql/schema.sql` (run in MySQL client).
4. Start server: `npm run dev`


## Important Notes
- The Mistral API request shapes used in `services/mistralService.js` are illustrative; confirm exact endpoints/payload per Mistral docs and adjust.
- The Pinecone HTTP endpoints used in `services/vectorService.js` are placeholders. Prefer using the provider's official SDK for reliability and security.
- Secure your API keys and restrict admin endpoints behind auth. Add rate-limiting in production.


## Next steps I can implement for you
- Provider-specific vector db implementation (Pinecone SDK / Qdrant client)
- Full auth (JWT) and admin dashboard
- Deployment scripts (Dockerfile + docker-compose)


---