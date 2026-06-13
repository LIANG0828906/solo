import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, saveDb } from '../db.js';

const router = Router();

function queryAll(sql: string, params: any[]): any[] {
  const db = getDb();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function queryOne(sql: string, params: any[]): any | undefined {
  const results = queryAll(sql, params);
  return results[0];
}

function run(sql: string, params: any[]): void {
  const db = getDb();
  db.run(sql, params);
  saveDb();
}

router.post('/ideas', (req: Request, res: Response) => {
  const { room_code, title, description, author, tags } = req.body;
  if (!room_code || !title || !description || !author) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  const id = uuidv4();
  const tagsJson = JSON.stringify(tags || []);
  run(
    'INSERT INTO ideas (id, room_code, title, description, author, tags) VALUES (?, ?, ?, ?, ?, ?)',
    [id, room_code, title.slice(0, 50), description, author, tagsJson]
  );

  const idea = queryOne('SELECT * FROM ideas WHERE id = ?', [id]);
  if (idea) {
    idea.vote_count = 0;
    idea.comment_count = 0;
  }

  res.status(201).json(idea);
});

router.get('/ideas', (req: Request, res: Response) => {
  const { room_code } = req.query;
  if (!room_code) {
    res.status(400).json({ error: 'room_code is required' });
    return;
  }

  const ideas = queryAll(
    `SELECT i.*,
      COUNT(DISTINCT v.id) as vote_count,
      COUNT(DISTINCT c.id) as comment_count
    FROM ideas i
    LEFT JOIN votes v ON v.idea_id = i.id
    LEFT JOIN comments c ON c.idea_id = i.id
    WHERE i.room_code = ?
    GROUP BY i.id
    ORDER BY i.created_at DESC
    LIMIT 100`,
    [room_code as string]
  );

  res.json(ideas);
});

router.post('/ideas/:id/vote', (req: Request, res: Response) => {
  const { id } = req.params;
  const { voter_name, room_code } = req.body;
  if (!voter_name || !room_code) {
    res.status(400).json({ error: 'Missing voter_name or room_code' });
    return;
  }

  const idea = queryOne('SELECT * FROM ideas WHERE id = ? AND room_code = ?', [id, room_code]);
  if (!idea) {
    res.status(404).json({ error: 'Idea not found' });
    return;
  }

  const existingVote = queryOne(
    'SELECT id FROM votes WHERE idea_id = ? AND voter_name = ? AND room_code = ?',
    [id, voter_name, room_code]
  );

  if (existingVote) {
    res.status(409).json({ error: 'Already voted' });
    return;
  }

  const voteId = uuidv4();
  run('INSERT INTO votes (id, idea_id, voter_name, room_code) VALUES (?, ?, ?, ?)', [voteId, id, voter_name, room_code]);

  const result = queryOne('SELECT COUNT(*) as count FROM votes WHERE idea_id = ?', [id]);
  const voteCount = result ? result.count : 0;

  res.json({ idea_id: id, vote_count: voteCount });
});

router.post('/ideas/:id/comment', (req: Request, res: Response) => {
  const { id } = req.params;
  const { author, content } = req.body;
  if (!author || !content) {
    res.status(400).json({ error: 'Missing author or content' });
    return;
  }

  const idea = queryOne('SELECT * FROM ideas WHERE id = ?', [id]);
  if (!idea) {
    res.status(404).json({ error: 'Idea not found' });
    return;
  }

  const commentId = uuidv4();
  run('INSERT INTO comments (id, idea_id, author, content) VALUES (?, ?, ?, ?)', [commentId, id, author, content]);

  const comment = queryOne('SELECT * FROM comments WHERE id = ?', [commentId]);
  const countResult = queryOne('SELECT COUNT(*) as count FROM comments WHERE idea_id = ?', [id]);
  const commentCount = countResult ? countResult.count : 0;

  res.status(201).json({ comment, idea_id: id, comment_count: commentCount });
});

router.get('/ideas/:id/comments', (req: Request, res: Response) => {
  const { id } = req.params;
  const comments = queryAll(
    'SELECT * FROM comments WHERE idea_id = ? ORDER BY created_at DESC',
    [id]
  );
  res.json(comments);
});

router.get('/ranking', (req: Request, res: Response) => {
  const { room_code } = req.query;
  if (!room_code) {
    res.status(400).json({ error: 'room_code is required' });
    return;
  }

  const ranking = queryAll(
    `SELECT i.id, i.title, i.author, COUNT(v.id) as vote_count
    FROM ideas i
    LEFT JOIN votes v ON v.idea_id = i.id
    WHERE i.room_code = ?
    GROUP BY i.id
    ORDER BY vote_count DESC
    LIMIT 10`,
    [room_code as string]
  );

  res.json(ranking);
});

router.get('/trend', (req: Request, res: Response) => {
  const { room_code } = req.query;
  if (!room_code) {
    res.status(400).json({ error: 'room_code is required' });
    return;
  }

  const trend = queryAll(
    `SELECT
      strftime('%Y-%m-%d %H:00', v.created_at) as time_slot,
      COUNT(*) as vote_count
    FROM votes v
    JOIN ideas i ON v.idea_id = i.id
    WHERE i.room_code = ?
      AND v.created_at >= datetime('now', '-24 hours')
    GROUP BY time_slot
    ORDER BY time_slot`,
    [room_code as string]
  );

  res.json(trend);
});

export default router;
