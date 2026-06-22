import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/presets', (_req, res) => {
  try {
    const configPath = path.join(__dirname, '..', 'public', 'config.json');
    const configData = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configData);
    res.json(config);
  } catch (err) {
    console.error('读取配置文件失败:', err);
    res.status(500).json({ error: '读取配置文件失败' });
  }
});

app.listen(PORT, () => {
  console.log(`后端服务已启动: http://localhost:${PORT}`);
  console.log(`预设接口: http://localhost:${PORT}/api/presets`);
});
