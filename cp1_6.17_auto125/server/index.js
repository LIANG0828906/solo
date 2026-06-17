import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3002;
const DATA_FILE = path.join(__dirname, 'projects.json');

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const readData = () => {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return [];
    }
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('读取数据失败:', err);
    return [];
  }
};

const writeData = (data) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('写入数据失败:', err);
    return false;
  }
};

const createDefaultSteps = () => [
  {
    id: uuidv4(),
    title: '裁切',
    duration: 15,
    notes: '使用裁皮刀和钢尺，沿皮革纹理方向裁切。注意保持刀刃锋利，避免边缘毛躁。',
    images: [],
    quality: 3,
    createdAt: Date.now()
  },
  {
    id: uuidv4(),
    title: '打磨',
    duration: 20,
    notes: '先用粗砂纸打磨边缘，再用细砂纸抛亮。打磨时保持均匀力度，注意边缘倒角均匀。',
    images: [],
    quality: 3,
    createdAt: Date.now() + 1
  },
  {
    id: uuidv4(),
    title: '封边',
    duration: 25,
    notes: '涂抹封边液后用打磨棒快速摩擦生热，使边缘光滑发亮。需要反复多次操作。',
    images: [],
    quality: 3,
    createdAt: Date.now() + 2
  }
];

app.get('/api/projects', (_req, res) => {
  const projects = readData();
  res.json(projects);
});

app.get('/api/projects/:id', (req, res) => {
  const projects = readData();
  const project = projects.find((p) => p.id === req.params.id);
  if (!project) {
    return res.status(404).json({ error: '项目不存在' });
  }
  res.json(project);
});

app.post('/api/projects', (req, res) => {
  const { name, coverDescription } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: '项目名称不能为空' });
  }

  const projects = readData();
  const newProject = {
    id: uuidv4(),
    name: name.trim(),
    coverDescription: coverDescription || '',
    steps: createDefaultSteps(),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  projects.unshift(newProject);
  writeData(projects);
  res.status(201).json(newProject);
});

app.put('/api/projects/:id', (req, res) => {
  const projects = readData();
  const index = projects.findIndex((p) => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '项目不存在' });
  }

  projects[index] = {
    ...projects[index],
    ...req.body,
    id: projects[index].id,
    createdAt: projects[index].createdAt,
    updatedAt: Date.now()
  };

  writeData(projects);
  res.json(projects[index]);
});

app.delete('/api/projects/:id', (req, res) => {
  const projects = readData();
  const filtered = projects.filter((p) => p.id !== req.params.id);
  if (filtered.length === projects.length) {
    return res.status(404).json({ error: '项目不存在' });
  }
  writeData(filtered);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Express 服务器运行在 http://localhost:${PORT}`);
});
