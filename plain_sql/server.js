require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool, initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Allow all origins (for Netlify frontend)
app.use(express.json());

const sendError = (res, code, msg) => res.status(code).json({ error: msg });
const noteFields = 'id, title, content, created_at, updated_at';

app.get('/api/notes', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT ${noteFields} FROM notes ORDER BY updated_at DESC`);
    res.json(rows);
  } catch (err) {
    sendError(res, 500, err.message);
  }
});

app.get('/api/notes/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT ${noteFields} FROM notes WHERE id = ?`, [req.params.id]);
    if (!rows.length) return sendError(res, 404, 'Note not found');
    res.json(rows[0]);
  } catch (err) {
    sendError(res, 500, err.message);
  }
});

app.post('/api/notes', async (req, res) => {
  const { title, content } = req.body || {};
  if (!title) return sendError(res, 400, 'title is required');
  try {
    const [r] = await pool.query('INSERT INTO notes (title, content) VALUES (?, ?)', [title, content || '']);
    const [[note]] = await pool.query(`SELECT ${noteFields} FROM notes WHERE id = ?`, [r.insertId]);
    res.status(201).json(note);
  } catch (err) {
    sendError(res, 500, err.message);
  }
});

app.put('/api/notes/:id', async (req, res) => {
  const { title, content } = req.body || {};
  try {
    const [r] = await pool.query(
      'UPDATE notes SET title = COALESCE(?, title), content = COALESCE(?, content) WHERE id = ?',
      [title, content, req.params.id]
    );
    if (!r.affectedRows) return sendError(res, 404, 'Note not found');
    const [[note]] = await pool.query(`SELECT ${noteFields} FROM notes WHERE id = ?`, [req.params.id]);
    res.json(note);
  } catch (err) {
    sendError(res, 500, err.message);
  }
});

app.delete('/api/notes/:id', async (req, res) => {
  try {
    const [r] = await pool.query('DELETE FROM notes WHERE id = ?', [req.params.id]);
    if (!r.affectedRows) return sendError(res, 404, 'Note not found');
    res.status(204).send();
  } catch (err) {
    sendError(res, 500, err.message);
  }
});

app.use(express.static('public'));

async function start() {
  await initDb();
  app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error('Failed to start:', err.message);
  if (err.message.includes('Access denied') && !process.env.DB_PASSWORD) {
    console.error('\nTip: Set DB_PASSWORD in .env to your MySQL password.');
  }
  process.exit(1);
});
