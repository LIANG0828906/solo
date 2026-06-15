import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';

const router = Router();

interface IdeaRow {
  id: string;
  room_code: string;
  title: string;
  description: string;
  author: string;
  tags: string;
  created_at: string;
  vote_count: number;
  comment_count: number;
}

router.post('/ideas', (req: Request, res: Response) => {
  const { room_code, title, description, author, tags } = req.body;
  if (!room_code || !title || !description || !author) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  const id = uuidv4();
  const tagsJson = JSON.stringify(tags || []);
  const stmt = db.prepare(
    'INSERT INTO ideas (id, room_code, title, description, author, tags) VALUES (?, ?, ?, ?, ?, ?)'
  );
  stmt.run(id, room_code, title.slice(0, 50), description, author, tagsJson);

  const idea = db.prepare(
    'SELECT *, 0 as vote_count, 0 as comment_count FROM ideas WHERE id = ?'
  ).get(id) as IdeaRow;

  res.status(201).json(idea);
});

router.get('/ideas', (req: Request, res: Response) => {
  const { room_code } = req.query;
  if (!room_code) {
    res.status(400).json({ error: 'room_code is required' });
    return;
  }

  const ideas = db.prepare(`
    SELECT i.*,
      COUNT(DISTINCT v.id) as vote_count,
      COUNT(DISTINCT c.id) as comment_count
    FROM ideas i
    LEFT JOIN votes v ON v.idea_id = i.id
    LEFT JOIN comments c ON c.idea_id = i.id
    WHERE i.room_code = ?
    GROUP BY i.id
    ORDER BY i.created_at DESC
    LIMIT 100
  `).all(room_code as string) as IdeaRow[];

  res.json(ideas);
});

router.post('/ideas/:id/vote', (req: Request, res: Response) => {
  const { id } = req.params;
  const { voter_name, room_code } = req.body;
  if (!voter_name || !room_code) {
    res.status(400).json({ error: 'Missing voter_name or room_code' });
    return;
  }

  const idea = db.prepare('SELECT * FROM ideas WHERE id = ? AND room_code = ?').get(id, room_code) as IdeaRow | undefined;
  if (!idea) {
    res.status(404).json({ error: 'Idea not found' });
    return;
  }

  const existingVote = db.prepare(
    'SELECT id FROM votes WHERE idea_id = ? AND voter_name = ? AND room_code = ?'
  ).get(id, voter_name, room_code);

  if (existingVote) {
    res.status(409).json({ error: 'Already voted' });
    return;
  }

  const voteId = uuidv4();
  db.prepare('INSERT INTO votes (id, idea_id, voter_name, room_code) VALUES (?, ?, ?, ?)').run(voteId, id, voter_name, room_code);

  const voteCount = (db.prepare('SELECT COUNT(*) as count FROM votes WHERE idea_id = ?').get(id) as { count: number }).count;

  res.json({ idea_id: id, vote_count: voteCount });
});

router.post('/ideas/:id/comment', (req: Request, res: Response) => {
  const { id } = req.params;
  const { author, content } = req.body;
  if (!author || !content) {
    res.status(400).json({ error: 'Missing author or content' });
    return;
  }

  const idea = db.prepare('SELECT * FROM ideas WHERE id = ?').get(id) as IdeaRow | undefined;
  if (!idea) {
    res.status(404).json({ error: 'Idea not found' });
    return;
  }

  const commentId = uuidv4();
  db.prepare('INSERT INTO comments (id, idea_id, author, content) VALUES (?, ?, ?, ?)').run(commentId, id, author, content);

  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(commentId);

  const commentCount = (db.prepare('SELECT COUNT(*) as count FROM comments WHERE idea_id = ?').get(id) as { count: number }).count;

  res.status(201).json({ comment, idea_id: id, comment_count: commentCount });
});

router.get('/ideas/:id/comments', (req: Request, res: Response) => {
  const { id } = req.params;
  const comments = db.prepare(
    'SELECT * FROM comments WHERE idea_id = ? ORDER BY created_at DESC'
  ).all(id);
  res.json(comments);
});

router.get('/ranking', (req: Request, res: Response) => {
  const { room_code } = req.query;
  if (!room_code) {
    res.status(400).json({ error: 'room_code is required' });
    return;
  }

  const ranking = db.prepare(`
    SELECT i.id, i.title, i.author, COUNT(v.id) as vote_count
    FROM ideas i
    LEFT JOIN votes v ON v.idea_id = i.id
    WHERE i.room_code = ?
    GROUP BY i.id
    ORDER BY vote_count DESC
    LIMIT 10
  `).all(room_code as string);

  res.json(ranking);
});

router.get('/trend', (req: Request, res: Response) => {
  const { room_code } = req.query;
  if (!room_code) {
    res.status(400).json({ error: 'room_code is required' });
    return;
  }

  const trend = db.prepare(`
    SELECT
      strftime('%Y-%m-%d %H:00', v.created_at) as time_slot,
      COUNT(*) as vote_count
    FROM votes v
    JOIN ideas i ON v.idea_id = i.id
    WHERE i.room_code = ?
      AND v.created_at >= datetime('now', '-24 hours')
    GROUP BY time_slot
    ORDER BY time_slot
  `).all(room_code as string);

  res.json(trend);
});

export default router;
