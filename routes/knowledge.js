const express = require('express');
const router = express.Router();
const { uploadKnowledge } = require('../controllers/knowledgeController');


router.post('/upload', uploadKnowledge);


module.exports = router;