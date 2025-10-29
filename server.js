import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

import chatRoutes from "./routes/chat.js";
import pdfRoutes from "./routes/pdfRoutes.js";

dotenv.config();

const app = express();

// Resolve __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from /public
app.use(express.static(path.join(__dirname, "public")));

// CORS
app.use(cors());

// JSON parser
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/chat", chatRoutes);
app.use("/api/pdf", pdfRoutes);

// Serve upload.html
app.get("/upload", (req, res) => {
  res.sendFile(path.resolve(__dirname, "public", "upload.html"));
});

// 404 fallback for unknown routes
app.use((req, res) => {
  res.status(404).send("❌ Not Found");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port http://localhost:${PORT}`);
});
