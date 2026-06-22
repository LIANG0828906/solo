import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { format } from 'date-fns';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

const DATA_DIR = path.join(__dirname, 'data');
const AI_CONFIG_PATH = path.join(DATA_DIR, 'ai-configs.json');
const BATTLE_RECORDS_PATH = path.join(DATA_DIR, 'battle-records.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const AI_NAMES = [
  '星云猎手', '虚空掠夺者', '深空守望者', '星尘指挥官',
  '暗影舰队司令', '银河终结者', '量子先锋', '虫洞漫游者',
  '脉冲战略家', '等离子将军', '曲率领主', '暗物质执政官'
];

const AI_AVATARS = [
  '🚀', '👾', '🛸', '🌌', '⭐', '💫', '🌠', '☄️', '🛰️', '🌙', '🪐', '🌍'
];

const DEFAULT_AI_CONFIGS = [
  {
    id: 'aggressive',
    name: '激进型AI',
    description: '偏好战列舰，高伤害输出',
    fleetComposition: { battleship: 2, cruiser: 1, frigate: 1 },
    tactics: { focusLowHP: true, skillUsage: 'aggressive' },
    resourceAllocation: { offense: 0.7, defense: 0.3 }
  },
  {
    id: 'defensive',
    name: '防御型AI',
    description: '偏好巡洋舰，护盾优先',
    fleetComposition: { battleship: 1, cruiser: 2, frigate: 1 },
    tactics: { focusLowHP: false, skillUsage: 'defensive' },
    resourceAllocation: { offense: 0.4, defense: 0.6 }
  },
  {
    id: 'balanced',
    name: '均衡型AI',
    description: '混合舰队，灵活应变',
    fleetComposition: { battleship: 1, cruiser: 1, frigate: 2 },
    tactics: { focusLowHP: true, skillUsage: 'balanced' },
    resourceAllocation: { offense: 0.5, defense: 0.5 }
  }
];

function ensureFiles() {
  if (!fs.existsSync(AI_CONFIG_PATH)) {
    fs.writeFileSync(AI_CONFIG_PATH, JSON.stringify(DEFAULT_AI_CONFIGS, null, 2));
  }
  if (!fs.existsSync(BATTLE_RECORDS_PATH)) {
    fs.writeFileSync(BATTLE_RECORDS_PATH, JSON.stringify([], null, 2));
  }
}

ensureFiles();

app.get('/api/ai-config', (req, res) => {
  try {
    const configs = JSON.parse(fs.readFileSync(AI_CONFIG_PATH, 'utf-8'));
    const randomConfig = configs[Math.floor(Math.random() * configs.length)];
    const randomName = AI_NAMES[Math.floor(Math.random() * AI_NAMES.length)];
    const randomAvatar = AI_AVATARS[Math.floor(Math.random() * AI_AVATARS.length)];

    const aiOpponent = {
      ...randomConfig,
      displayName: randomName,
      avatar: randomAvatar,
      generatedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
    };

    res.json(aiOpponent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load AI config', details: error.message });
  }
});

app.post('/api/record', (req, res) => {
  try {
    const record = {
      id: uuidv4(),
      ...req.body,
      timestamp: format(new Date(), 'yyyy-MM-dd HH:mm:ss')
    };

    let records = [];
    try {
      records = JSON.parse(fs.readFileSync(BATTLE_RECORDS_PATH, 'utf-8'));
    } catch (e) {
      records = [];
    }

    records.unshift(record);
    if (records.length > 100) {
      records = records.slice(0, 100);
    }

    fs.writeFileSync(BATTLE_RECORDS_PATH, JSON.stringify(records, null, 2));
    res.json({ success: true, id: record.id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save record', details: error.message });
  }
});

app.get('/api/record', (req, res) => {
  try {
    const records = JSON.parse(fs.readFileSync(BATTLE_RECORDS_PATH, 'utf-8'));
    const limit = parseInt(req.query.limit) || 10;
    res.json(records.slice(0, limit));
  } catch (error) {
    res.status(500).json({ error: 'Failed to load records', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Zero Fleet Commander backend running on http://localhost:${PORT}`);
  console.log(`📁 Data directory: ${DATA_DIR}`);
});
