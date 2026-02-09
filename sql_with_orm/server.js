require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { eq, desc } = require('drizzle-orm');
const { db, notes, initDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Allow all origins (for Netlify/frontend)
app.use(express.json());

const sendError = (res, code, msg) => res.status(code).json({ error: msg });

// Get all notes (Drizzle)
app.get('/api/notes', async (req, res) => {
  try {
    const rows = await db.select().from(notes).orderBy(desc(notes.updatedAt)).execute();
    res.json(rows);
  } catch (err) {
    sendError(res, 500, err.message);
  }
});

// Get a single note
app.get('/api/notes/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const rows = await db.select().from(notes).where(eq(notes.id, id)).execute();
    if (!rows.length) return sendError(res, 404, 'Note not found');
    res.json(rows[0]);
  } catch (err) {
    sendError(res, 500, err.message);
  }
});

// Create a note
app.post('/api/notes', async (req, res) => {
  const { title, content } = req.body || {};
  if (!title) return sendError(res, 400, 'title is required');
  try {
    const result = await db
      .insert(notes)
      .values({ title, content: content || '' })
      .execute();

    const insertedId = result.insertId ?? result[0]?.insertId;
    const [note] = await db.select().from(notes).where(eq(notes.id, insertedId)).execute();
    res.status(201).json(note);
  } catch (err) {
    sendError(res, 500, err.message);
  }
});

// Update a note
app.put('/api/notes/:id', async (req, res) => {
  const { title, content } = req.body || {};
  const id = Number(req.params.id);

  try {
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;

    const result = await db.update(notes).set(updateData).where(eq(notes.id, id)).execute();
    const affected = result.affectedRows ?? result[0]?.affectedRows;
    if (!affected) return sendError(res, 404, 'Note not found');

    const [note] = await db.select().from(notes).where(eq(notes.id, id)).execute();
    res.json(note);
  } catch (err) {
    sendError(res, 500, err.message);
  }
});

// Delete a note
app.delete('/api/notes/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const result = await db.delete(notes).where(eq(notes.id, id)).execute();
    const affected = result.affectedRows ?? result[0]?.affectedRows;
    if (!affected) return sendError(res, 404, 'Note not found');
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

