const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3001;

const DATA_DIR = path.join(__dirname, 'data');
const CARDS_FILE = path.join(DATA_DIR, 'cards.json');

app.use(cors());
app.use(express.json());

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(CARDS_FILE)) {
    fs.writeFileSync(CARDS_FILE, JSON.stringify([], null, 2));
  }
}

function readCards() {
  ensureDataDir();
  try {
    const data = fs.readFileSync(CARDS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function writeCards(cards) {
  ensureDataDir();
  fs.writeFileSync(CARDS_FILE, JSON.stringify(cards, null, 2));
}

function tokenize(text) {
  if (!text) return [];
  const words = text.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
  return words;
}

function computeTFIDF(cards) {
  const docs = cards.map(card => {
    const text = (card.title || '') + ' ' + (card.content || '') + ' ' + (card.tags || []).join(' ');
    return tokenize(text);
  });

  const docCount = docs.length;
  const idf = {};

  docs.forEach(tokens => {
    const unique = new Set(tokens);
    unique.forEach(word => {
      idf[word] = (idf[word] || 0) + 1;
    });
  });

  Object.keys(idf).forEach(word => {
    idf[word] = Math.log((docCount + 1) / (idf[word] + 1)) + 1;
  });

  const vectors = docs.map(tokens => {
    const tf = {};
    tokens.forEach(word => {
      tf[word] = (tf[word] || 0) + 1;
    });
    const vector = {};
    let magnitude = 0;
    Object.keys(tf).forEach(word => {
      const val = tf[word] * (idf[word] || 0);
      vector[word] = val;
      magnitude += val * val;
    });
    magnitude = Math.sqrt(magnitude) || 1;
    Object.keys(vector).forEach(word => {
      vector[word] = vector[word] / magnitude;
    });
    return vector;
  });

  return { vectors, idf };
}

function cosineSimilarity(v1, v2) {
  let dot = 0;
  const words = Object.keys(v1).length < Object.keys(v2).length ? Object.keys(v1) : Object.keys(v2);
  words.forEach(word => {
    if (v2[word] !== undefined) {
      dot += v1[word] * v2[word];
    }
  });
  return dot;
}

app.get('/api/cards', (req, res) => {
  const cards = readCards();
  res.json(cards);
});

app.post('/api/cards', (req, res) => {
  const { title, content, tags } = req.body;
  if (!title && !content) {
    return res.status(400).json({ error: '标题和内容不能同时为空' });
  }
  const cards = readCards();
  const newCard = {
    id: uuidv4(),
    title: title || '',
    content: content || '',
    tags: tags || [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  cards.unshift(newCard);
  writeCards(cards);
  res.status(201).json(newCard);
});

app.put('/api/cards/:id', (req, res) => {
  const { id } = req.params;
  const { title, content, tags } = req.body;
  const cards = readCards();
  const index = cards.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: '卡片不存在' });
  }
  cards[index] = {
    ...cards[index],
    title: title !== undefined ? title : cards[index].title,
    content: content !== undefined ? content : cards[index].content,
    tags: tags !== undefined ? tags : cards[index].tags,
    updatedAt: Date.now()
  };
  writeCards(cards);
  res.json(cards[index]);
});

app.delete('/api/cards/:id', (req, res) => {
  const { id } = req.params;
  const cards = readCards();
  const filtered = cards.filter(c => c.id !== id);
  if (filtered.length === cards.length) {
    return res.status(404).json({ error: '卡片不存在' });
  }
  writeCards(filtered);
  res.json({ success: true });
});

app.get('/api/cards/similarity', (req, res) => {
  const cards = readCards();
  const threshold = parseFloat(req.query.threshold || '0.3');
  
  if (cards.length < 2) {
    return res.json([]);
  }

  const { vectors } = computeTFIDF(cards);
  const similarities = [];

  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const sim = cosineSimilarity(vectors[i], vectors[j]);
      if (sim >= threshold) {
        similarities.push({
          card1Id: cards[i].id,
          card2Id: cards[j].id,
          similarity: Math.round(sim * 100) / 100
        });
      }
    }
  }

  const refCounts = {};
  cards.forEach(c => { refCounts[c.id] = 0; });
  similarities.forEach(s => {
    refCounts[s.card1Id] = (refCounts[s.card1Id] || 0) + 1;
    refCounts[s.card2Id] = (refCounts[s.card2Id] || 0) + 1;
  });

  cards.forEach(c => {
    c.refCount = refCounts[c.id] || 0;
  });
  writeCards(cards);

  res.json(similarities);
});

app.listen(PORT, () => {
  console.log(`灵感卡片后端服务运行在 http://localhost:${PORT}`);
  ensureDataDir();
});
