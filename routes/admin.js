// routes/knowledge.js
import express from 'express';
const router = express.Router();

import db from '../db/mysql.js'; // Make sure your mysql export uses ESM

// Get latest 200 knowledge entries
router.get('/knowledge', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM knowledge_entries ORDER BY created_at DESC LIMIT 200'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching knowledge entries:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a knowledge entry by ID
router.delete('/knowledge/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // TODO: also delete from vector DB using vector_id
    await db.execute('DELETE FROM knowledge_entries WHERE id = ?', [id]);
    res.json({ message: 'deleted' });
  } catch (err) {
    console.error('Error deleting knowledge entry:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
