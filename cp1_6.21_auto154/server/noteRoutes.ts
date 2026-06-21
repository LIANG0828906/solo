import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Note } from '../src/types';
import { notesMap, boards, connectionsMap } from './boardRoutes';

const router = Router();

router.post('/boards/:boardId/notes', (req: Request, res: Response) => {
  const { boardId } = req.params;
  if (!boards.has(boardId)) {
    return res.status(404).json({ error: '白板不存在' });
  }
  const { type, x, y, width, height, content } = req.body;
  const now = new Date().toISOString();
  const note: Note = {
    id: uuidv4(),
    boardId,
    type: type || 'text',
    x: x || 100,
    y: y || 100,
    width: width || 250,
    height: height || 150,
    content: content || getDefaultContent(type || 'text'),
    createdAt: now,
    updatedAt: now,
  };
  const boardNotes = notesMap.get(boardId) || [];
  boardNotes.push(note);
  notesMap.set(boardId, boardNotes);
  res.status(201).json(note);
});

router.put('/notes/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  let foundNote: Note | null = null;
  let targetBoardId: string | null = null;

  for (const [boardId, notes] of notesMap.entries()) {
    const note = notes.find((n) => n.id === id);
    if (note) {
      foundNote = note;
      targetBoardId = boardId;
      break;
    }
  }

  if (!foundNote || !targetBoardId) {
    return res.status(404).json({ error: '便签不存在' });
  }

  const { x, y, width, height, content } = req.body;
  if (typeof x === 'number') foundNote.x = x;
  if (typeof y === 'number') foundNote.y = y;
  if (typeof width === 'number') foundNote.width = width;
  if (typeof height === 'number') foundNote.height = height;
  if (content !== undefined) foundNote.content = content;
  foundNote.updatedAt = new Date().toISOString();

  const boardNotes = notesMap.get(targetBoardId) || [];
  const idx = boardNotes.findIndex((n) => n.id === id);
  if (idx !== -1) {
    boardNotes[idx] = foundNote;
    notesMap.set(targetBoardId, boardNotes);
  }

  res.json(foundNote);
});

router.delete('/notes/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  let targetBoardId: string | null = null;

  for (const [boardId, notes] of notesMap.entries()) {
    const idx = notes.findIndex((n) => n.id === id);
    if (idx !== -1) {
      notes.splice(idx, 1);
      notesMap.set(boardId, notes);
      targetBoardId = boardId;
      break;
    }
  }

  if (!targetBoardId) {
    return res.status(404).json({ error: '便签不存在' });
  }

  const connections = connectionsMap.get(targetBoardId) || [];
  const filteredConnections = connections.filter(
    (c) => c.sourceId !== id && c.targetId !== id
  );
  connectionsMap.set(targetBoardId, filteredConnections);

  res.status(204).send();
});

router.post('/boards/:boardId/connections', (req: Request, res: Response) => {
  const { boardId } = req.params;
  if (!boards.has(boardId)) {
    return res.status(404).json({ error: '白板不存在' });
  }
  const { sourceId, targetId } = req.body;
  const connection = {
    id: uuidv4(),
    sourceId,
    targetId,
  };
  const connections = connectionsMap.get(boardId) || [];
  connections.push(connection);
  connectionsMap.set(boardId, connections);
  res.status(201).json(connection);
});

router.delete('/connections/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  for (const [boardId, connections] of connectionsMap.entries()) {
    const idx = connections.findIndex((c) => c.id === id);
    if (idx !== -1) {
      connections.splice(idx, 1);
      connectionsMap.set(boardId, connections);
      return res.status(204).send();
    }
  }
  res.status(404).json({ error: '连接线不存在' });
});

function getDefaultContent(type: string) {
  switch (type) {
    case 'text':
      return { text: '双击编辑文字便签\n支持**加粗**语法' };
    case 'image':
      return { url: '' };
    case 'todo':
      return {
        items: [
          { id: uuidv4(), text: '待办事项 1', checked: false },
          { id: uuidv4(), text: '待办事项 2', checked: false },
        ],
      };
    default:
      return { text: '' };
  }
}

export default router;
