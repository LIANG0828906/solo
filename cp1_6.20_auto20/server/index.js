import express from 'express';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3002;
const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'playlists.json');

const gradientPresets = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(135deg, #7C3AED 0%, #a855f7 100%)'
];

function getRandomGradient() {
  return gradientPresets[Math.floor(Math.random() * gradientPresets.length)];
}

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ playlists: [] }, null, 2));
  }
}

function readData() {
  ensureDataFile();
  const content = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(content);
}

function writeData(data) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.use(bodyParser.json({ limit: '50mb' }));
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.get('/api/playlists', (req, res) => {
  try {
    const data = readData();
    const playlists = data.playlists.map(p => ({
      id: p.id,
      name: p.name,
      coverGradient: p.coverGradient,
      songs: p.songs.map(s => ({ ...s, fileUrl: '' })),
      createdAt: p.createdAt
    }));
    res.json({ playlists });
  } catch (error) {
    res.status(500).json({ error: '获取歌单列表失败' });
  }
});

app.post('/api/playlists', (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: '歌单名称不能为空' });
    }
    const data = readData();
    const newPlaylist = {
      id: uuidv4(),
      name: name.trim(),
      coverGradient: getRandomGradient(),
      songs: [],
      createdAt: new Date().toISOString()
    };
    data.playlists.push(newPlaylist);
    writeData(data);
    res.json({ playlist: { ...newPlaylist, songs: [] } });
  } catch (error) {
    res.status(500).json({ error: '创建歌单失败' });
  }
});

app.get('/api/playlists/:id', (req, res) => {
  try {
    const data = readData();
    const playlist = data.playlists.find(p => p.id === req.params.id);
    if (!playlist) {
      return res.status(404).json({ error: '歌单不存在' });
    }
    const safePlaylist = {
      ...playlist,
      songs: playlist.songs.map(s => ({ ...s, fileUrl: '' }))
    };
    res.json({ playlist: safePlaylist });
  } catch (error) {
    res.status(500).json({ error: '获取歌单失败' });
  }
});

app.put('/api/playlists/:id', (req, res) => {
  try {
    const { name, songs } = req.body;
    const data = readData();
    const index = data.playlists.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: '歌单不存在' });
    }
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ error: '歌单名称不能为空' });
      }
      data.playlists[index].name = name.trim();
    }
    if (songs !== undefined) {
      data.playlists[index].songs = songs.map(s => ({
        ...s,
        fileUrl: ''
      }));
    }
    writeData(data);
    const safePlaylist = {
      ...data.playlists[index],
      songs: data.playlists[index].songs.map(s => ({ ...s, fileUrl: '' }))
    };
    res.json({ playlist: safePlaylist });
  } catch (error) {
    res.status(500).json({ error: '更新歌单失败' });
  }
});

app.delete('/api/playlists/:id', (req, res) => {
  try {
    const data = readData();
    const index = data.playlists.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: '歌单不存在' });
    }
    data.playlists.splice(index, 1);
    writeData(data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: '删除歌单失败' });
  }
});

app.listen(PORT, () => {
  console.log(`后端服务运行在 http://localhost:${PORT}`);
});
