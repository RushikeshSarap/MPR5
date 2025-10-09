const express = require('express');
const cors = require('cors');
require('dotenv').config();

const chatRoutes = require('./routes/chat');

const app = express();

// Serve static widget
app.use(express.static('public'));

// Enable CORS
app.use(cors());

// Parse JSON
app.use(express.json({ limit: '1mb' }));

// Routes
app.use('/api/chat', chatRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
