// routes/uploadKnowledge.js
import express from 'express';
const router = express.Router();

import { uploadKnowledge } from '../controllers/knowledgeController.js';

// POST route to upload knowledge
router.post('/upload', uploadKnowledge);

export default router;
