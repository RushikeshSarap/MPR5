const express = require('express');
const router = express.Router();
const db = require('../db/mysql');


router.get('/knowledge', async (req, res) => {
const [rows] = await db.execute('SELECT * FROM knowledge_entries ORDER BY created_at DESC LIMIT 200');
res.json(rows);
});


router.delete('/knowledge/:id', async (req, res) => {
const id = req.params.id;
// TODO: also delete from vector DB using vector_id
await db.execute('DELETE FROM knowledge_entries WHERE id = ?', [id]);
res.json({ message: 'deleted' });
});


module.exports = router;