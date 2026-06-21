import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Board, Note } from '../src/types';

export const boards = new Map<string, Board>();
export const notesMap = new Map<string, Note[]>();
export const connectionsMap = new Map<string, { id: string; sourceId: string; targetId: string }[]>();

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const boardList = Array.from(boards.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  res.json(boardList);
});

router.post('/', (req: Request, res: Response) => {
  const { name } = req.body;
  const now = new Date().toISOString();
  const id = uuidv4();
  const board: Board = {
    id,
    name: name || `白板 ${boards.size + 1}`,
    createdAt: now,
    updatedAt: now,
    color: generateBoardColor(boards.size),
  };
  boards.set(id, board);
  notesMap.set(id, []);
  connectionsMap.set(id, []);
  res.status(201).json(board);
});

router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const board = boards.get(id);
  if (!board) {
    return res.status(404).json({ error: '白板不存在' });
  }
  const notes = notesMap.get(id) || [];
  const connections = connectionsMap.get(id) || [];
  res.json({ board, notes, connections });
});

router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const board = boards.get(id);
  if (!board) {
    return res.status(404).json({ error: '白板不存在' });
  }
  const { name } = req.body;
  if (name) {
    board.name = name;
  }
  board.updatedAt = new Date().toISOString();
  boards.set(id, board);
  res.json(board);
});

router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  if (!boards.has(id)) {
    return res.status(404).json({ error: '白板不存在' });
  }
  boards.delete(id);
  notesMap.delete(id);
  connectionsMap.delete(id);
  res.status(204).send();
});

function generateBoardColor(index: number): string {
  const colors = [
    '#FEF3C7',
    '#DBEAFE',
    '#DCFCE7',
    '#FCE7F3',
    '#FED7AA',
    '#E9D5FF',
    '#FECACA',
    '#CFFAFE',
  ];
  return colors[index % colors.length];
}

export default router;
