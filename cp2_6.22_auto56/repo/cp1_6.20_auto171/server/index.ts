import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_FILE = path.join(__dirname, 'templates.json');
const PORT = 3001;

async function readTemplates(): Promise<any[]> {
  try {
    const raw = await fs.readFile(TEMPLATES_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    await fs.writeFile(TEMPLATES_FILE, '[]', 'utf-8');
    return [];
  }
}

async function writeTemplates(templates: any[]): Promise<void> {
  await fs.writeFile(TEMPLATES_FILE, JSON.stringify(templates, null, 2), 'utf-8');
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/templates', async (_req: Request, res: Response) => {
  try {
    const all = await readTemplates();
    res.json(all.map(t => ({ id: t.id, name: t.name, createdAt: t.createdAt })));
  } catch (err) {
    res.status(500).json({ error: '读取失败' });
  }
});

app.post('/api/templates', async (req: Request, res: Response) => {
  try {
    const { name, level } = req.body;
    if (!name || !level) {
      res.status(400).json({ error: '缺少name或level' });
      return;
    }
    const all = await readTemplates();
    const id = uuidv4();
    const createdAt = Date.now();
    all.push({ id, name, createdAt, level });
    await writeTemplates(all);
    res.json({ id, ok: true });
  } catch (err) {
    res.status(500).json({ error: '写入失败' });
  }
});

app.get('/api/templates/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const all = await readTemplates();
    const found = all.find(t => t.id === id);
    if (!found) {
      res.status(404).json({ error: '未找到' });
      return;
    }
    res.json(found);
  } catch (err) {
    res.status(500).json({ error: '读取失败' });
  }
});

app.listen(PORT, () => {
  console.log(`[server] 运行在 http://localhost:${PORT}`);
});
