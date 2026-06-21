
import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());

function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return { cards: [] };
    }
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading data:', error);
    return { cards: [] };
  }
}

function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing data:', error);
    return false;
  }
}

app.get('/api/cards', (req, res) => {
  const data = readData();
  res.json({ success: true, data: data.cards });
});

app.post('/api/cards', (req, res) => {
  const { title, content, color, x, y } = req.body;
  
  if (!title) {
    return res.status(400).json({ success: false, error: '标题不能为空' });
  }

  const now = new Date().toISOString();
  const newCard = {
    id: uuidv4(),
    title: title.substring(0, 30),
    content: (content || '').substring(0, 200),
    color: color || '#FFFFFF',
    x: x || 100,
    y: y || 100,
    createdAt: now,
    updatedAt: now
  };

  const data = readData();
  data.cards.push(newCard);
  writeData(data);

  res.status(201).json({ success: true, data: newCard });
});

app.put('/api/cards/:id', (req, res) => {
  const { id } = req.params;
  const { title, content, color, x, y } = req.body;

  const data = readData();
  const cardIndex = data.cards.findIndex(card => card.id === id);

  if (cardIndex === -1) {
    return res.status(404).json({ success: false, error: '卡片不存在' });
  }

  const card = data.cards[cardIndex];
  if (title !== undefined) card.title = title.substring(0, 30);
  if (content !== undefined) card.content = content.substring(0, 200);
  if (color !== undefined) card.color = color;
  if (x !== undefined) card.x = x;
  if (y !== undefined) card.y = y;
  card.updatedAt = new Date().toISOString();

  writeData(data);

  res.json({ success: true, data: card });
});

app.delete('/api/cards/:id', (req, res) => {
  const { id } = req.params;

  const data = readData();
  const cardIndex = data.cards.findIndex(card => card.id === id);

  if (cardIndex === -1) {
    return res.status(404).json({ success: false, error: '卡片不存在' });
  }

  data.cards.splice(cardIndex, 1);
  writeData(data);

  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
