import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'boards.json');

app.use(cors());
app.use(express.json());

function readData(): Record<string, any> {
  if (!fs.existsSync(DATA_FILE)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify({}, null, 2));
    return {};
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function writeData(data: Record<string, any>): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.get('/api/boards', (_req, res) => {
  const data = readData();
  const boards = Object.values(data).map((board: any) => ({
    id: board.id,
    name: board.name,
  }));
  res.json(boards);
});

app.post('/api/boards', (req, res) => {
  const data = readData();
  const id = uuidv4();
  const board = {
    id,
    name: req.body.name,
    lists: {
      todo: [],
      inProgress: [],
      done: [],
    },
  };
  data[id] = board;
  writeData(data);
  res.json(board);
});

app.put('/api/boards/:id', (req, res) => {
  const data = readData();
  const board = data[req.params.id];
  if (!board) {
    res.status(404).json({ error: 'Board not found' });
    return;
  }
  if (req.body.lists) {
    data[req.params.id] = req.body;
  } else {
    board.name = req.body.name;
  }
  writeData(data);
  res.json(data[req.params.id]);
});

app.delete('/api/boards/:id', (req, res) => {
  const data = readData();
  if (!data[req.params.id]) {
    res.status(404).json({ error: 'Board not found' });
    return;
  }
  delete data[req.params.id];
  writeData(data);
  res.json({ success: true });
});

app.get('/api/boards/:id', (req, res) => {
  const data = readData();
  const board = data[req.params.id];
  if (!board) {
    res.status(404).json({ error: 'Board not found' });
    return;
  }
  res.json(board);
});

app.post('/api/boards/:id/tasks', (req, res) => {
  const data = readData();
  const board = data[req.params.id];
  if (!board) {
    res.status(404).json({ error: 'Board not found' });
    return;
  }
  const { listId, task } = req.body;
  if (!board.lists[listId]) {
    res.status(400).json({ error: 'Invalid listId' });
    return;
  }
  const newTask = { ...task, id: task.id || uuidv4() };
  board.lists[listId].push(newTask);
  writeData(data);
  res.json(newTask);
});

app.put('/api/boards/:id/tasks/:taskId', (req, res) => {
  const data = readData();
  const board = data[req.params.id];
  if (!board) {
    res.status(404).json({ error: 'Board not found' });
    return;
  }
  const { listId, task } = req.body;
  if (!board.lists[listId]) {
    res.status(400).json({ error: 'Invalid listId' });
    return;
  }
  const taskIndex = board.lists[listId].findIndex(
    (t: any) => t.id === req.params.taskId
  );
  if (taskIndex === -1) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  board.lists[listId][taskIndex] = task;
  writeData(data);
  res.json(task);
});

app.delete('/api/boards/:id/tasks/:taskId', (req, res) => {
  const data = readData();
  const board = data[req.params.id];
  if (!board) {
    res.status(404).json({ error: 'Board not found' });
    return;
  }
  const { listId } = req.body;
  if (!board.lists[listId]) {
    res.status(400).json({ error: 'Invalid listId' });
    return;
  }
  const taskIndex = board.lists[listId].findIndex(
    (t: any) => t.id === req.params.taskId
  );
  if (taskIndex === -1) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  board.lists[listId].splice(taskIndex, 1);
  writeData(data);
  res.json({ success: true });
});

app.listen(3001, () => {
  console.log('Server running on port 3001');
});
