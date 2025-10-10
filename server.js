// server.js
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import chatRoutes from './routes/chat.js'; // Must use "export default router" in chat.js

const app = express();

// Serve static files from "public" folder
app.use(express.static('public'));

// Enable CORS for all origins (customize if needed)
app.use(cors());

// Parse JSON bodies
app.use(express.json({ limit: '1mb' }));

// Optional: Parse URL-encoded form data
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/chat', chatRoutes);

// Start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access the server at http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
