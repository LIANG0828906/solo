import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Card, Connection, ProjectData } from '../src/types';
import { generateId } from '../src/utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'project.json');

app.use(cors());
app.use(bodyParser.json());

const readProjectData = async (): Promise<ProjectData> => {
  try {
    const data = await fs.promises.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data) as ProjectData;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      const initialData: ProjectData = {
        version: '1.0.0',
        timestamp: Date.now(),
        cards: [],
        connections: [],
      };
      await writeProjectData(initialData);
      return initialData;
    }
    throw err;
  }
};

const writeProjectData = async (data: ProjectData): Promise<void> => {
  if (!fs.existsSync(DATA_DIR)) {
    await fs.promises.mkdir(DATA_DIR, { recursive: true });
  }
  const dataWithTimestamp = {
    ...data,
    timestamp: Date.now(),
  };
  await fs.promises.writeFile(DATA_FILE, JSON.stringify(dataWithTimestamp, null, 2), 'utf-8');
};

const initDataFile = async (): Promise<void> => {
  if (!fs.existsSync(DATA_FILE)) {
    if (!fs.existsSync(DATA_DIR)) {
      await fs.promises.mkdir(DATA_DIR, { recursive: true });
    }
    const initialData: ProjectData = {
      version: '1.0.0',
      timestamp: Date.now(),
      cards: [],
      connections: [],
    };
    await fs.promises.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  }
};

app.get('/api/cards', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await readProjectData();
    res.json(data.cards);
  } catch (err) {
    next(err);
  }
});

app.post('/api/cards', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, content, tags, priority, position } = req.body;
    const now = Date.now();
    const newCard: Card = {
      id: generateId(),
      title,
      content,
      tags: tags || [],
      priority: priority || 'P3',
      position: position || { x: 0, y: 0 },
      createdAt: now,
      updatedAt: now,
    };
    const data = await readProjectData();
    data.cards.push(newCard);
    await writeProjectData(data);
    res.status(201).json(newCard);
  } catch (err) {
    next(err);
  }
});

app.put('/api/cards/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = await readProjectData();
    const cardIndex = data.cards.findIndex(card => card.id === id);
    if (cardIndex === -1) {
      res.status(404).json({ error: 'Card not found' });
      return;
    }
    const updatedCard: Card = {
      ...data.cards[cardIndex],
      ...req.body,
      id,
      updatedAt: Date.now(),
    };
    data.cards[cardIndex] = updatedCard;
    await writeProjectData(data);
    res.json(updatedCard);
  } catch (err) {
    next(err);
  }
});

app.delete('/api/cards/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = await readProjectData();
    const cardIndex = data.cards.findIndex(card => card.id === id);
    if (cardIndex === -1) {
      res.status(404).json({ error: 'Card not found' });
      return;
    }
    data.cards.splice(cardIndex, 1);
    data.connections = data.connections.filter(
      conn => conn.sourceId !== id && conn.targetId !== id
    );
    await writeProjectData(data);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

app.get('/api/connections', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await readProjectData();
    res.json(data.connections);
  } catch (err) {
    next(err);
  }
});

app.post('/api/connections', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sourceId, targetId, type } = req.body;
    const data = await readProjectData();
    const sourceExists = data.cards.some(card => card.id === sourceId);
    const targetExists = data.cards.some(card => card.id === targetId);
    if (!sourceExists || !targetExists) {
      res.status(400).json({ error: 'Source or target card does not exist' });
      return;
    }
    const newConnection: Connection = {
      id: generateId(),
      sourceId,
      targetId,
      type: type || '关联',
      createdAt: Date.now(),
    };
    data.connections.push(newConnection);
    await writeProjectData(data);
    res.status(201).json(newConnection);
  } catch (err) {
    next(err);
  }
});

app.put('/api/connections/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = await readProjectData();
    const connIndex = data.connections.findIndex(conn => conn.id === id);
    if (connIndex === -1) {
      res.status(404).json({ error: 'Connection not found' });
      return;
    }
    const updatedConnection: Connection = {
      ...data.connections[connIndex],
      ...req.body,
      id,
    };
    data.connections[connIndex] = updatedConnection;
    await writeProjectData(data);
    res.json(updatedConnection);
  } catch (err) {
    next(err);
  }
});

app.delete('/api/connections/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = await readProjectData();
    const connIndex = data.connections.findIndex(conn => conn.id === id);
    if (connIndex === -1) {
      res.status(404).json({ error: 'Connection not found' });
      return;
    }
    data.connections.splice(connIndex, 1);
    await writeProjectData(data);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

app.get('/api/project', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await readProjectData();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

app.put('/api/project', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const newData: ProjectData = {
      ...req.body,
      version: '1.0.0',
      timestamp: Date.now(),
    };
    await writeProjectData(newData);
    res.json(newData);
  } catch (err) {
    next(err);
  }
});

app.get('/api/export', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await readProjectData();
    const exportData = {
      ...data,
      version: '1.0.0',
      timestamp: Date.now(),
    };
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="creative-cards-export-${Date.now()}.json"`);
    res.json(exportData);
  } catch (err) {
    next(err);
  }
});

app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
  void next;
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

if (NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

const startServer = async () => {
  await initDataFile();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} (${NODE_ENV})`);
    console.log(`Data file: ${DATA_FILE}`);
  });
};

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
