import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_DIR = path.join(__dirname, 'data');
const SAVE_FILE = path.join(DATA_DIR, 'saves.json');
const LEADERBOARD_FILE = path.join(DATA_DIR, 'leaderboard.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(SAVE_FILE)) {
  fs.writeFileSync(SAVE_FILE, JSON.stringify({}, null, 2));
}

if (!fs.existsSync(LEADERBOARD_FILE)) {
  fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify([], null, 2));
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));

function readJsonFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return {};
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), { flag: 'w' });
    return true;
  } catch (err) {
    console.error('写入文件失败:', err);
    return false;
  }
}

app.post('/api/save', (req, res) => {
  try {
    const { playerName, state } = req.body;
    if (!playerName || !state) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }
    const saves = readJsonFile(SAVE_FILE);
    saves[playerName] = {
      playerName,
      state,
      timestamp: Date.now(),
    };
    const success = writeJsonFile(SAVE_FILE, saves);
    if (success) {
      res.json({ success: true, message: '存档成功' });
    } else {
      res.status(500).json({ success: false, message: '存档失败' });
    }
  } catch (err) {
    console.error('存档错误:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

app.post('/api/load', (req, res) => {
  try {
    const { playerName } = req.body;
    if (!playerName) {
      return res.status(400).json({ success: false, message: '缺少玩家名称' });
    }
    const saves = readJsonFile(SAVE_FILE);
    if (saves[playerName]) {
      res.json({ success: true, data: saves[playerName] });
    } else {
      res.json({ success: false, message: '未找到存档' });
    }
  } catch (err) {
    console.error('读档错误:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

app.post('/api/leaderboard', (req, res) => {
  try {
    const { playerName, coins } = req.body;
    if (!playerName || coins === undefined) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }
    const leaderboard = readJsonFile(LEADERBOARD_FILE);
    leaderboard.push({
      id: uuidv4(),
      playerName,
      coins,
      timestamp: Date.now(),
    });
    leaderboard.sort((a, b) => b.coins - a.coins);
    const top10 = leaderboard.slice(0, 10);
    writeJsonFile(LEADERBOARD_FILE, leaderboard);
    res.json({ success: true, data: top10 });
  } catch (err) {
    console.error('排行榜错误:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

app.get('/api/leaderboard', (req, res) => {
  try {
    const leaderboard = readJsonFile(LEADERBOARD_FILE);
    leaderboard.sort((a, b) => b.coins - a.coins);
    res.json({ success: true, data: leaderboard.slice(0, 10) });
  } catch (err) {
    console.error('获取排行榜错误:', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`奇幻农场服务器已启动: http://localhost:${PORT}`);
  console.log(`数据目录: ${DATA_DIR}`);
});
