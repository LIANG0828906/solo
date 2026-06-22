import { Router } from 'express';
import { store } from '../memoryStore';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getPool } from '../db';

const router = Router();

router.get('/', async (req, res) => {
  const pool = getPool();
  try {
    if (pool) {
      const { rows } = await pool.query(`
        SELECT n.*, 
          (SELECT COALESCE(AVG(rating), 0) FROM note_ratings WHERE note_id = n.id) as avg_rating,
          (SELECT COUNT(*) FROM note_ratings WHERE note_id = n.id) as rating_count
        FROM notes n ORDER BY n.created_at DESC
      `);
      return res.json(rows);
    }
  } catch (e) {}

  const notes = store.notes.map(n => {
    const ratings = store.noteRatings.filter(r => r.note_id === n.id);
    const avgRating = ratings.length > 0 ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : 0;
    return { ...n, avg_rating: avgRating, rating_count: ratings.length };
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  res.json(notes);
});

router.get('/mine', authMiddleware, async (req: AuthRequest, res) => {
  const pool = getPool();
  try {
    if (pool) {
      const { rows } = await pool.query(`
        SELECT n.*, 
          EXISTS(SELECT 1 FROM note_pledges p WHERE p.note_id = n.id AND p.user_id = $1) as pledged,
          COALESCE((SELECT SUM(amount) FROM note_pledges p WHERE p.note_id = n.id AND p.user_id = $1), 0) as user_amount
        FROM notes n 
        WHERE EXISTS(SELECT 1 FROM note_pledges p WHERE p.note_id = n.id AND p.user_id = $1)
           OR n.creator_id = $1
        ORDER BY n.created_at DESC
      `, [req.userId]);
      return res.json(rows);
    }
  } catch (e) {}

  const notes = store.notes.filter(n => {
    const pledged = store.notePledges.some(p => p.note_id === n.id && p.user_id === req.userId);
    return pledged || n.creator_id === req.userId;
  }).map(n => {
    const userPledges = store.notePledges.filter(p => p.note_id === n.id && p.user_id === req.userId);
    const userAmount = userPledges.reduce((s, p) => s + p.amount, 0);
    return { ...n, pledged: userPledges.length > 0, user_amount: userAmount };
  });
  res.json(notes);
});

router.get('/:id', async (req, res) => {
  const noteId = parseInt(req.params.id);
  const pool = getPool();
  try {
    if (pool) {
      const noteResult = await pool.query('SELECT * FROM notes WHERE id = $1', [noteId]);
      if (!noteResult.rows[0]) return res.status(404).json({ message: '笔记不存在' });
      const sectionsResult = await pool.query('SELECT * FROM note_sections WHERE note_id = $1 ORDER BY position', [noteId]);
      const ratingsResult = await pool.query('SELECT COALESCE(AVG(rating), 0) as avg_rating, COUNT(*) as rating_count FROM note_ratings WHERE note_id = $1', [noteId]);
      return res.json({
        ...noteResult.rows[0],
        sections: sectionsResult.rows,
        avg_rating: parseFloat(ratingsResult.rows[0].avg_rating) || 0,
        rating_count: parseInt(ratingsResult.rows[0].rating_count) || 0,
      });
    }
  } catch (e) {}

  const note = store.notes.find(n => n.id === noteId);
  if (!note) return res.status(404).json({ message: '笔记不存在' });
  const sections = store.noteSections.filter(s => s.note_id === noteId).sort((a, b) => a.position - b.position);
  const ratings = store.noteRatings.filter(r => r.note_id === noteId);
  const avgRating = ratings.length > 0 ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : 0;
  res.json({ ...note, sections, avg_rating: avgRating, rating_count: ratings.length });
});

router.get('/:id/sections/:sectionId', authMiddleware, async (req: AuthRequest, res) => {
  const noteId = parseInt(req.params.id);
  const sectionId = parseInt(req.params.sectionId);
  const pool = getPool();

  const checkAccess = async (): Promise<boolean> => {
    try {
      if (pool) {
        const noteResult = await pool.query('SELECT * FROM notes WHERE id = $1', [noteId]);
        const note = noteResult.rows[0];
        if (!note) return false;
        if (note.creator_id === req.userId) return true;
        if (parseFloat(note.current_amount) >= parseFloat(note.target_amount)) {
          const pledgeResult = await pool.query('SELECT 1 FROM note_pledges WHERE note_id = $1 AND user_id = $2', [noteId, req.userId]);
          return pledgeResult.rows.length > 0;
        }
        return false;
      }
    } catch (e) {}
    const note = store.notes.find(n => n.id === noteId);
    if (!note) return false;
    if (note.creator_id === req.userId) return true;
    if (note.current_amount >= note.target_amount) {
      return store.notePledges.some(p => p.note_id === noteId && p.user_id === req.userId);
    }
    return false;
  };

  const hasAccess = await checkAccess();
  if (!hasAccess) {
    return res.status(403).json({ message: '需要完成众筹后才能阅读' });
  }

  try {
    if (pool) {
      const { rows } = await pool.query('SELECT * FROM note_sections WHERE id = $1 AND note_id = $2', [sectionId, noteId]);
      if (!rows[0]) return res.status(404).json({ message: '段落不存在' });
      return res.json(rows[0]);
    }
  } catch (e) {}

  const section = store.noteSections.find(s => s.id === sectionId && s.note_id === noteId);
  if (!section) return res.status(404).json({ message: '段落不存在' });
  res.json(section);
});

router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  const { title, subject, target_amount, sections } = req.body;
  if (!title || !subject || !target_amount || !sections || !sections.length) {
    return res.status(400).json({ message: '请填写完整信息' });
  }
  const pool = getPool();
  try {
    if (pool) {
      const noteResult = await pool.query(
        'INSERT INTO notes (title, subject, target_amount, creator_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [title, subject, target_amount, req.userId]
      );
      const note = noteResult.rows[0];
      for (let i = 0; i < sections.length; i++) {
        await pool.query(
          'INSERT INTO note_sections (note_id, section_title, content, position) VALUES ($1, $2, $3, $4)',
          [note.id, sections[i].section_title, sections[i].content, i + 1]
        );
      }
      return res.json(note);
    }
  } catch (e) {}

  const newNote = {
    id: store.nextId.notes++,
    title,
    subject,
    target_amount: parseFloat(target_amount),
    current_amount: 0,
    creator_id: req.userId!,
    created_at: new Date().toISOString(),
  };
  store.notes.push(newNote);
  sections.forEach((s: any, i: number) => {
    store.noteSections.push({
      id: store.nextId.noteSections++,
      note_id: newNote.id,
      section_title: s.section_title,
      content: s.content,
      position: i + 1,
    });
  });
  res.json(newNote);
});

router.post('/:id/pledge', authMiddleware, async (req: AuthRequest, res) => {
  const noteId = parseInt(req.params.id);
  const amount = 10;
  const pool = getPool();
  try {
    if (pool) {
      const noteResult = await pool.query('SELECT * FROM notes WHERE id = $1', [noteId]);
      if (!noteResult.rows[0]) return res.status(404).json({ message: '笔记不存在' });
      const note = noteResult.rows[0];
      if (parseFloat(note.current_amount) >= parseFloat(note.target_amount)) {
        return res.status(400).json({ message: '众筹已完成' });
      }
      await pool.query(
        'INSERT INTO note_pledges (note_id, user_id, amount) VALUES ($1, $2, $3)',
        [noteId, req.userId, amount]
      );
      const newAmount = Math.min(parseFloat(note.current_amount) + amount, parseFloat(note.target_amount));
      await pool.query('UPDATE notes SET current_amount = $1 WHERE id = $2', [newAmount, noteId]);
      return res.json({ message: '众筹成功', current_amount: newAmount });
    }
  } catch (e) {}

  const note = store.notes.find(n => n.id === noteId);
  if (!note) return res.status(404).json({ message: '笔记不存在' });
  if (note.current_amount >= note.target_amount) {
    return res.status(400).json({ message: '众筹已完成' });
  }
  store.notePledges.push({
    id: store.nextId.notePledges++,
    note_id: noteId,
    user_id: req.userId!,
    amount,
    created_at: new Date().toISOString(),
  });
  note.current_amount = Math.min(note.current_amount + amount, note.target_amount);
  res.json({ message: '众筹成功', current_amount: note.current_amount });
});

router.post('/:id/rate', authMiddleware, async (req: AuthRequest, res) => {
  const noteId = parseInt(req.params.id);
  const { rating } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: '评分需在1-5之间' });
  }
  const pool = getPool();
  try {
    if (pool) {
      await pool.query(
        `INSERT INTO note_ratings (note_id, user_id, rating) VALUES ($1, $2, $3)
         ON CONFLICT (note_id, user_id) DO UPDATE SET rating = EXCLUDED.rating`,
        [noteId, req.userId, rating]
      );
      const { rows } = await pool.query('SELECT COALESCE(AVG(rating), 0) as avg_rating, COUNT(*) as rating_count FROM note_ratings WHERE note_id = $1', [noteId]);
      return res.json({ avg_rating: parseFloat(rows[0].avg_rating) || 0, rating_count: parseInt(rows[0].rating_count) || 0 });
    }
  } catch (e) {}

  const existing = store.noteRatings.find(r => r.note_id === noteId && r.user_id === req.userId);
  if (existing) {
    existing.rating = rating;
  } else {
    store.noteRatings.push({
      id: store.nextId.noteRatings++,
      note_id: noteId,
      user_id: req.userId!,
      rating,
      created_at: new Date().toISOString(),
    });
  }
  const ratings = store.noteRatings.filter(r => r.note_id === noteId);
  const avgRating = ratings.length > 0 ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length : 0;
  res.json({ avg_rating: avgRating, rating_count: ratings.length });
});

export default router;
