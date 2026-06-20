import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.post('/upload', upload.single('image'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No file uploaded' });
  }
  const url = `/uploads/${req.file.filename}`;
  res.json({ success: true, url });
});

router.get('/notes', (req: Request, res: Response) => {
  const stageId = req.query.stageId as string;
  const userId = req.query.userId as string;

  try {
    const stmt = db.prepare(`
      SELECT 
        n.*,
        u.username,
        COUNT(nl.id) as likes,
        CASE WHEN nl2.id IS NOT NULL THEN 1 ELSE 0 END as isLikedByMe
      FROM note n
      JOIN user u ON n.user_id = u.id
      LEFT JOIN note_like nl ON n.id = nl.note_id
      LEFT JOIN note_like nl2 ON n.id = nl2.note_id AND nl2.user_id = ?
      WHERE n.stage_id = ?
      GROUP BY n.id
      ORDER BY n.created_at DESC
    `);
    const notes = stmt.all(userId || 0, stageId);
    res.json({ success: true, data: notes });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch notes' });
  }
});

router.post('/notes', (req: Request, res: Response) => {
  const { stageId, userId, text, imageUrls } = req.body;
  const imageUrlsStr = Array.isArray(imageUrls) ? JSON.stringify(imageUrls) : imageUrls || '';

  try {
    const stmt = db.prepare(`
      INSERT INTO note (stage_id, user_id, text, image_urls)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(stageId, userId, text, imageUrlsStr);
    
    const newNote = db.prepare(`
      SELECT 
        n.*,
        u.username,
        0 as likes,
        0 as isLikedByMe
      FROM note n
      JOIN user u ON n.user_id = u.id
      WHERE n.id = ?
    `).get(result.lastInsertRowid);
    
    res.status(201).json({ success: true, data: newNote });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create note' });
  }
});

router.post('/notes/:id/like', (req: Request, res: Response) => {
  const noteId = req.params.id;
  const { userId } = req.body;

  try {
    const checkStmt = db.prepare('SELECT * FROM note_like WHERE note_id = ? AND user_id = ?');
    const existing = checkStmt.get(noteId, userId);

    if (existing) {
      const deleteStmt = db.prepare('DELETE FROM note_like WHERE id = ?');
      deleteStmt.run(existing.id);
    } else {
      const insertStmt = db.prepare('INSERT INTO note_like (note_id, user_id) VALUES (?, ?)');
      insertStmt.run(noteId, userId);
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to toggle like' });
  }
});

router.get('/messages', (req: Request, res: Response) => {
  const stageId = req.query.stageId as string;

  try {
    const stmt = db.prepare(`
      SELECT 
        m.*,
        u.username
      FROM message m
      JOIN user u ON m.user_id = u.id
      WHERE m.stage_id = ?
      ORDER BY m.created_at ASC
    `);
    const messages = stmt.all(stageId);
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
});

router.post('/messages', (req: Request, res: Response) => {
  const { stageId, userId, content, mentions } = req.body;
  const mentionsStr = Array.isArray(mentions) ? JSON.stringify(mentions) : mentions || '';

  try {
    const stmt = db.prepare(`
      INSERT INTO message (stage_id, user_id, content, mentions)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(stageId, userId, content, mentionsStr);
    
    const newMessage = db.prepare(`
      SELECT 
        m.*,
        u.username
      FROM message m
      JOIN user u ON m.user_id = u.id
      WHERE m.id = ?
    `).get(result.lastInsertRowid);
    
    res.status(201).json({ success: true, data: newMessage });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create message' });
  }
});

export default router;
