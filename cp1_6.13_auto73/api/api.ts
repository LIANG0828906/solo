import express, { type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Task, BoardData, UpdateTaskRequest } from '../src/types/index.js';
import { broadcastBoardUpdate } from './socketService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE_PATH = path.join(__dirname, 'data.json');

const router = express.Router();

const readData = (): BoardData => {
  const rawData = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
  return JSON.parse(rawData) as BoardData;
};

const writeData = (data: BoardData): void => {
  fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
};

const findTask = (
  data: BoardData,
  taskId: string
): { task: Task; columnId: string; boardId: string; taskIndex: number } | null => {
  for (const board of data.boards) {
    for (const column of board.columns) {
      const taskIndex = column.tasks.findIndex((t) => t.id === taskId);
      if (taskIndex !== -1) {
        return { task: column.tasks[taskIndex], columnId: column.id, boardId: board.id, taskIndex };
      }
    }
  }
  return null;
};

router.get('/boards', (_req: Request, res: Response) => {
  try {
    const data = readData();
    res.json(data);
  } catch (error) {
    console.error('Error reading data:', error);
    res.status(500).json({ success: false, error: 'Failed to read data' });
  }
});

router.get('/board/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = readData();
    const board = data.boards.find((b) => b.id === id);
    if (!board) {
      return res.status(404).json({ success: false, error: 'Board not found' });
    }
    res.json(board);
  } catch (error) {
    console.error('Error reading board:', error);
    res.status(500).json({ success: false, error: 'Failed to read board' });
  }
});

router.put('/task/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body as UpdateTaskRequest;
    const { task, boardId, columnId, sourceColumnId, targetColumnId } = body;

    const data = readData();
    const board = data.boards.find((b) => b.id === boardId);

    if (!board) {
      return res.status(404).json({ success: false, error: 'Board not found' });
    }

    let action: 'moved' | 'updated' = 'updated';
    let taskToMove: Task | null = null;
    let sourceColId = sourceColumnId;

    if (sourceColumnId && targetColumnId && sourceColumnId !== targetColumnId) {
      action = 'moved';
      const sourceColumn = board.columns.find((c) => c.id === sourceColumnId);
      if (!sourceColumn) {
        return res.status(404).json({ success: false, error: 'Source column not found' });
      }
      const taskIndex = sourceColumn.tasks.findIndex((t) => t.id === id);
      if (taskIndex === -1) {
        return res.status(404).json({ success: false, error: 'Task not found in source column' });
      }
      taskToMove = sourceColumn.tasks[taskIndex];
      sourceColumn.tasks.splice(taskIndex, 1);
    } else {
      const existing = findTask(data, id);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Task not found' });
      }
      sourceColId = existing.columnId;
      const sourceColumn = board.columns.find((c) => c.id === existing.columnId);
      if (!sourceColumn) {
        return res.status(404).json({ success: false, error: 'Source column not found' });
      }
      const taskIndex = sourceColumn.tasks.findIndex((t) => t.id === id);
      if (taskIndex !== -1) {
        sourceColumn.tasks[taskIndex] = { ...task, id };
      }
      taskToMove = { ...task, id };
    }

    const targetColId = targetColumnId || columnId || sourceColId;
    const targetColumn = board.columns.find((c) => c.id === targetColId);
    if (!targetColumn) {
      return res.status(404).json({ success: false, error: 'Target column not found' });
    }

    if (taskToMove && action === 'moved') {
      targetColumn.tasks.push(taskToMove);
    }

    writeData(data);

    const finalTask = taskToMove || { ...task, id };
    broadcastBoardUpdate({
      boardId,
      action,
      task: finalTask,
      user: finalTask.assignee || '匿名用户',
      columnId: targetColId,
      taskTitle: finalTask.title,
    });

    res.json({ success: true, task: finalTask });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ success: false, error: 'Failed to update task' });
  }
});

router.post('/task', (req: Request, res: Response) => {
  try {
    const body = req.body as UpdateTaskRequest;
    const { task, boardId, columnId } = body;

    const data = readData();
    const board = data.boards.find((b) => b.id === boardId);

    if (!board) {
      return res.status(404).json({ success: false, error: 'Board not found' });
    }

    const column = board.columns.find((c) => c.id === columnId);
    if (!column) {
      return res.status(404).json({ success: false, error: 'Column not found' });
    }

    column.tasks.push(task);
    writeData(data);

    broadcastBoardUpdate({
      boardId,
      action: 'created',
      task,
      user: task.assignee || '匿名用户',
      columnId,
      taskTitle: task.title,
    });

    res.status(201).json({ success: true, task });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ success: false, error: 'Failed to create task' });
  }
});

router.delete('/task/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { columnId, boardId } = req.body as { columnId: string; boardId: string };

    const data = readData();
    const board = data.boards.find((b) => b.id === boardId);

    if (!board) {
      return res.status(404).json({ success: false, error: 'Board not found' });
    }

    const column = board.columns.find((c) => c.id === columnId);
    if (!column) {
      return res.status(404).json({ success: false, error: 'Column not found' });
    }

    const taskIndex = column.tasks.findIndex((t) => t.id === id);
    if (taskIndex === -1) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    const deletedTask = column.tasks[taskIndex];
    column.tasks.splice(taskIndex, 1);
    writeData(data);

    broadcastBoardUpdate({
      boardId,
      action: 'deleted',
      task: deletedTask,
      user: deletedTask.assignee || '匿名用户',
      columnId,
      taskTitle: deletedTask.title,
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ success: false, error: 'Failed to delete task' });
  }
});

export default router;
