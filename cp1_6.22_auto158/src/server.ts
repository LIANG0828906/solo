import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORAGE_KEY = 'risk-tracker-data';
const STORAGE_FILE = path.join(__dirname, '..', 'storage.json');

interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  createdAt: number;
}

interface Risk {
  id: string;
  projectId: string;
  title: string;
  description: string;
  level: 'high' | 'medium' | 'low';
  probability: number;
  impact: number;
  response: string;
  owner: string;
  status: 'pending' | 'processing' | 'completed';
  createdAt: number;
}

interface StorageData {
  projects: Project[];
  risks: Risk[];
}

const stores = {
  projects: new Map<string, Project>(),
  risks: new Map<string, Risk>(),
};

class LocalStorageSimulator {
  private data: Record<string, string> = {};

  constructor() {
    this.loadFromFile();
  }

  private loadFromFile(): void {
    try {
      if (fs.existsSync(STORAGE_FILE)) {
        const content = fs.readFileSync(STORAGE_FILE, 'utf-8');
        this.data = JSON.parse(content);
      }
    } catch (error) {
      console.error('Failed to load storage:', error);
    }
  }

  private saveToFile(): void {
    try {
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save storage:', error);
    }
  }

  getItem(key: string): string | null {
    return this.data[key] ?? null;
  }

  setItem(key: string, value: string): void {
    this.data[key] = value;
    this.saveToFile();
  }

  removeItem(key: string): void {
    delete this.data[key];
    this.saveToFile();
  }
}

const localStorage = new LocalStorageSimulator();

function saveToStorage(): void {
  const data: StorageData = {
    projects: Array.from(stores.projects.values()),
    risks: Array.from(stores.risks.values()),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadFromStorage(): void {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const data: StorageData = JSON.parse(stored);
      stores.projects.clear();
      stores.risks.clear();
      data.projects.forEach((project) => stores.projects.set(project.id, project));
      data.risks.forEach((risk) => stores.risks.set(risk.id, risk));
    } catch (error) {
      console.error('Failed to parse stored data:', error);
    }
  }
}

loadFromStorage();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/projects', (_req: Request, res: Response<Project[]>) => {
  res.json(Array.from(stores.projects.values()));
});

app.post('/api/projects', (req: Request, res: Response<Project>) => {
  const { name, description, startDate } = req.body;

  if (!name || !description) {
    res.status(400).json({ error: 'Name and description are required' } as unknown as Project);
    return;
  }

  const project: Project = {
    id: uuidv4(),
    name,
    description,
    startDate: startDate || new Date().toISOString().split('T')[0],
    createdAt: Date.now(),
  };

  stores.projects.set(project.id, project);
  saveToStorage();
  res.status(201).json(project);
});

app.get('/api/projects/:id/risks', (req: Request<{ id: string }>, res: Response<Risk[]>) => {
  const { id } = req.params;

  if (!stores.projects.has(id)) {
    res.status(404).json([]);
    return;
  }

  const projectRisks = Array.from(stores.risks.values())
    .filter((risk) => risk.projectId === id)
    .sort((a, b) => b.createdAt - a.createdAt);
  res.json(projectRisks);
});

app.post('/api/projects/:id/risks', (req: Request<{ id: string }>, res: Response<Risk>) => {
  const { id } = req.params;
  const { title, description, level, probability, impact, response, owner } = req.body;

  if (!stores.projects.has(id)) {
    res.status(404).json({ error: 'Project not found' } as unknown as Risk);
    return;
  }

  if (!title || !description || !level) {
    res.status(400).json({ error: 'Title, description and level are required' } as unknown as Risk);
    return;
  }

  const validLevels: Risk['level'][] = ['high', 'medium', 'low'];
  if (!validLevels.includes(level)) {
    res.status(400).json({ error: 'Invalid level' } as unknown as Risk);
    return;
  }

  const risk: Risk = {
    id: uuidv4(),
    projectId: id,
    title,
    description,
    level,
    probability: probability || 0,
    impact: impact || 1,
    response: response || '',
    owner: owner || '',
    status: 'pending',
    createdAt: Date.now(),
  };

  stores.risks.set(risk.id, risk);
  saveToStorage();
  res.status(201).json(risk);
});

app.patch('/api/risks/:id/status', (req: Request<{ id: string }>, res: Response<Risk>) => {
  const { id } = req.params;
  const { status } = req.body;

  const risk = stores.risks.get(id);
  if (!risk) {
    res.status(404).json({ error: 'Risk not found' } as unknown as Risk);
    return;
  }

  const validStatuses: Risk['status'][] = ['pending', 'processing', 'completed'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ error: 'Invalid status' } as unknown as Risk);
    return;
  }

  risk.status = status;
  stores.risks.set(id, risk);
  saveToStorage();
  res.json(risk);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
