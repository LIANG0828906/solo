import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 4000;

app.use(express.json());

const dataPath = join(__dirname, '..', '..', 'data');

const ensureDataDir = () => {
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true });
  }
};

const getDataFilePath = (id: string) => join(dataPath, `${id}.json`);

app.get('/api/load', (req, res) => {
  ensureDataDir();
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    const files = fs.readdirSync(dataPath).filter((f) => f.endsWith('.json'));
    const designs = files.map((file) => {
      try {
        const content = fs.readFileSync(join(dataPath, file), 'utf-8');
        return JSON.parse(content);
      } catch {
        return null;
      }
    }).filter(Boolean);

    return res.json({ success: true, designs });
  }

  const filePath = getDataFilePath(id);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: '设计稿不存在' });
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const designData = JSON.parse(content);
    res.json({ success: true, data: designData });
  } catch (err) {
    res.status(500).json({ success: false, error: '读取设计稿失败' });
  }
});

app.post('/api/save', (req, res) => {
  ensureDataDir();
  const { id, name, elements, canvasSize, dimensions } = req.body;

  if (!id || !elements) {
    return res.status(400).json({ success: false, error: '缺少必要参数' });
  }

  const now = new Date().toISOString();
  const filePath = getDataFilePath(id);

  try {
    const existingData = fs.existsSync(filePath)
      ? JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      : null;

    const designData = {
      id,
      name: name || '未命名设计',
      elements,
      canvasSize: canvasSize || 'A3-portrait',
      dimensions: dimensions || { width: 420, height: 594 },
      createdAt: existingData?.createdAt || now,
      updatedAt: now,
    };

    fs.writeFileSync(filePath, JSON.stringify(designData, null, 2), 'utf-8');
    res.json({ success: true, data: designData });
  } catch (err) {
    console.error('保存失败:', err);
    res.status(500).json({ success: false, error: '保存设计稿失败' });
  }
});

app.listen(PORT, () => {
  console.log(`Express 服务已启动: http://localhost:${PORT}`);
  console.log(`API 路径: /api/save, /api/load`);
});
