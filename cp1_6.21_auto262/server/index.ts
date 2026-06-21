import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import type { Board, SaveBoardRequest } from '../src/types';

const app = express();
const PORT = 3001;

const boards = new Map<string, Board>();

app.use(cors());
app.use(express.json());

app.get('/api/boards/:id', (req, res) => {
  const board = boards.get(req.params.id);
  if (!board) {
    res.status(404).json({ error: 'Board not found' });
    return;
  }
  res.json(board);
});

app.post('/api/boards', (req, res) => {
  const body = req.body as SaveBoardRequest;
  const now = Date.now();

  if (body.id && boards.has(body.id)) {
    const existing = boards.get(body.id)!;
    const updated: Board = {
      ...existing,
      title: body.title,
      cards: body.cards,
      updatedAt: now,
    };
    boards.set(body.id, updated);
    res.json(updated);
    return;
  }

  const newBoard: Board = {
    id: body.id || uuidv4(),
    userId: body.userId,
    title: body.title,
    cards: body.cards,
    createdAt: now,
    updatedAt: now,
  };
  boards.set(newBoard.id, newBoard);
  res.json(newBoard);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
