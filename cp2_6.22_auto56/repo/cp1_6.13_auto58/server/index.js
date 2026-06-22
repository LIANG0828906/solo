import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const dataDir = path.join(__dirname, '..', 'data');

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

app.post('/api/save', (req, res) => {
  try {
    const body = req.body;

    if (!Array.isArray(body)) {
      return res.status(400).json({ error: '请求体必须是一个数组' });
    }

    for (let i = 0; i < body.length; i++) {
      const item = body[i];
      if (!item || typeof item !== 'object') {
        return res.status(400).json({ error: `第 ${i + 1} 个元素必须是对象` });
      }
      if (!item.id) {
        return res.status(400).json({ error: `第 ${i + 1} 个元素缺少 id 字段` });
      }
      if (!item.type) {
        return res.status(400).json({ error: `第 ${i + 1} 个元素缺少 type 字段` });
      }
    }

    ensureDataDir();
    const id = uuidv4();
    const filePath = path.join(dataDir, `${id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(body, null, 2), 'utf-8');

    res.json({ success: true, id });
  } catch (err) {
    console.error('Save error:', err);
    res.status(500).json({ error: '保存失败' });
  }
});

app.get('/api/load/:id', (req, res) => {
  try {
    const { id } = req.params;
    const filePath = path.join(dataDir, `${id}.json`);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '未找到该草稿' });
    }

    const data = fs.readFileSync(filePath, 'utf-8');
    res.json(JSON.parse(data));
  } catch (err) {
    console.error('Load error:', err);
    res.status(500).json({ error: '加载失败' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
