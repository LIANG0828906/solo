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

app.use(cors());
app.use(express.json());

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const getMindMapPath = (id) => path.join(DATA_DIR, `${id}.json`);

app.get('/api/mindmaps', (req, res) => {
  try {
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
    const mindmaps = files.map(file => {
      const content = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf-8'));
      return {
        id: content.id,
        name: content.name,
        updatedAt: content.updatedAt
      };
    }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    res.json(mindmaps);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load mind maps' });
  }
});

app.get('/api/mindmaps/:id', (req, res) => {
  try {
    const { id } = req.params;
    const filePath = getMindMapPath(id);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Mind map not found' });
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load mind map' });
  }
});

app.post('/api/mindmaps', (req, res) => {
  try {
    const { id, name, nodes } = req.body;
    const now = new Date().toISOString();
    const mindMapId = id || uuidv4();
    const filePath = getMindMapPath(mindMapId);
    
    let existingData = null;
    if (fs.existsSync(filePath)) {
      existingData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    
    const data = {
      id: mindMapId,
      name: name || '未命名思维导图',
      nodes: nodes || [],
      createdAt: existingData?.createdAt || now,
      updatedAt: now
    };
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    res.json(data);
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({ error: 'Failed to save mind map' });
  }
});

app.delete('/api/mindmaps/:id', (req, res) => {
  try {
    const { id } = req.params;
    const filePath = getMindMapPath(id);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Mind map not found' });
    }
    fs.unlinkSync(filePath);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete mind map' });
  }
});

app.listen(PORT, () => {
  console.log(`Mind map server running on http://localhost:${PORT}`);
});
