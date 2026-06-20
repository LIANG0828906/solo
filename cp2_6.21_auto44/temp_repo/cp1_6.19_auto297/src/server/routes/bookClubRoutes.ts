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

router.get('/', (req: Request, res: Response) => {
  const userId = req.query.userId as string;
  
  try {
    let clubs;
    if (userId) {
      const stmt = db.prepare(`
        SELECT c.* FROM club c
        JOIN club_member cm ON c.id = cm.club_id
        WHERE cm.user_id = ?
        ORDER BY c.created_at DESC
      `);
      clubs = stmt.all(userId);
    } else {
      const stmt = db.prepare('SELECT * FROM club ORDER BY created_at DESC');
      clubs = stmt.all();
    }
    res.json({ success: true, data: clubs });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch clubs' });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const stmt = db.prepare('SELECT * FROM club WHERE id = ?');
    const club = stmt.get(id);
    if (!club) {
      return res.status(404).json({ success: false, error: 'Club not found' });
    }
    res.json({ success: true, data: club });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch club' });
  }
});

router.post('/', upload.single('coverImage'), (req: Request, res: Response) => {
  const { name, description, creatorId } = req.body;
  const coverImageUrl = req.file ? `/uploads/${req.file.filename}` : '';

  try {
    const stmt = db.prepare(`
      INSERT INTO club (name, description, cover_image_url, creator_id)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(name, description, coverImageUrl, creatorId);
    
    const memberStmt = db.prepare(`
      INSERT INTO club_member (club_id, user_id)
      VALUES (?, ?)
    `);
    memberStmt.run(result.lastInsertRowid, creatorId);

    const newClub = db.prepare('SELECT * FROM club WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ success: true, data: newClub });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create club' });
  }
});

router.get('/:id/books', (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const stmt = db.prepare('SELECT * FROM book WHERE club_id = ? ORDER BY created_at DESC');
    const books = stmt.all(id);
    res.json({ success: true, data: books });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch books' });
  }
});

router.post('/books', upload.single('coverImage'), (req: Request, res: Response) => {
  const { clubId, title, author, stages } = req.body;
  const coverImageUrl = req.file ? `/uploads/${req.file.filename}` : '';

  try {
    const bookStmt = db.prepare(`
      INSERT INTO book (club_id, title, author, cover_image_url)
      VALUES (?, ?, ?, ?)
    `);
    const bookResult = bookStmt.run(clubId, title, author, coverImageUrl);
    const bookId = bookResult.lastInsertRowid;

    const stagesArray = JSON.parse(stages);
    const stageStmt = db.prepare(`
      INSERT INTO stage (book_id, name, start_page, end_page, start_date, end_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    for (const stage of stagesArray) {
      stageStmt.run(bookId, stage.name, stage.startPage, stage.endPage, stage.startDate, stage.endDate);
    }

    const newBook = db.prepare('SELECT * FROM book WHERE id = ?').get(bookId);
    res.status(201).json({ success: true, data: newBook });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create book' });
  }
});

router.get('/books/:id/stages', (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const stmt = db.prepare('SELECT * FROM stage WHERE book_id = ? ORDER BY start_date ASC');
    const stages = stmt.all(id);
    res.json({ success: true, data: stages });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch stages' });
  }
});

export default router;
