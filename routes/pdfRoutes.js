// routes/pdfRoutes.js
import express from "express";
import multer from "multer";
import { uploadAndConvertPdf } from "../controllers/pdfController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/upload", upload.single("pdfFile"), uploadAndConvertPdf);

export default router;
