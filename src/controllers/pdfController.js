import fs from "fs/promises";
import path from "path";
import axios from "axios";
import { PDFExtract } from "pdf.js-extract";
import { storeChunksInPinecone } from "../services/pineconeService.js";

export const uploadAndConvertPdf = async (req, res) => {
  const filePath = req.file?.path;

  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded." });
    }

    const dataBuffer = await fs.readFile(filePath);
    const pdfExtract = new PDFExtract();
    const data = await pdfExtract.extractBuffer(dataBuffer);

    // 🧾 Extract plain text
    let fullText = data.pages
      .map((page) => page.content.map((item) => item.str).join(" "))
      .join("\n")
      .trim();

    if (!fullText) {
      await fs.unlink(filePath);
      return res.status(400).json({ error: "PDF contains no text." });
    }

    // 🧩 Extract structured tables via Python microservice
    let tableData = [];
    try {
      const pythonServiceUrl = "http://localhost:5001/extract";
      const tableResponse = await axios.post(pythonServiceUrl, {
        file_path: path.resolve(filePath),
      });

      if (tableResponse.data?.tables?.length > 0) {
        tableData = tableResponse.data.tables;
      }
    } catch (err) {
      console.warn("⚠️ Table extraction service failed:", err.message);
    }

    // 🧠 Merge text + table data into chunks
    const chunkSize = 1000;
    const chunks = [];

    // 1️⃣ Add text chunks
    for (let i = 0; i < fullText.length; i += chunkSize) {
      const chunkText = fullText.slice(i, i + chunkSize).trim();
      if (chunkText) chunks.push(chunkText);
    }

    // 2️⃣ Add table data as JSON strings
    for (const table of tableData) {
      const jsonTable = JSON.stringify(table.data);
      if (jsonTable.length > chunkSize) {
        // split long tables too
        for (let i = 0; i < jsonTable.length; i += chunkSize) {
          chunks.push(jsonTable.slice(i, i + chunkSize));
        }
      } else {
        chunks.push(jsonTable);
      }
    }

    // 🪣 Store in Pinecone
    let pineconeResult = {};
    try {
      pineconeResult = await storeChunksInPinecone(
        chunks,
        req.file.originalname
      );
    } catch (e) {
      console.error("Pinecone upload error:", e);
    }

    // 🧹 Cleanup
    await fs.unlink(filePath);

    res.status(200).json({
      fileName: req.file.originalname,
      totalChunks: chunks.length,
      documentId: req.file.originalname.replace(/\.[^/.]+$/, ""), // filename without extension
      tablesExtracted: tableData.length,
      pineconeStatus: pineconeResult,
      sampleChunks: chunks.slice(0, 3),
    });
  } catch (error) {
    console.error("Error processing PDF:", error);
    if (filePath) {
      await fs
        .unlink(filePath)
        .catch((unlinkErr) => console.error("Error deleting file:", unlinkErr));
    }
    res.status(500).json({ error: "Failed to process PDF file." });
  }
};
