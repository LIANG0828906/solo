const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let runes = [];
let battles = [];

app.get('/api/runes', (req, res) => {
  res.json(runes);
});

app.post('/api/runes', (req, res) => {
  const rune = {
    id: uuidv4(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  if (runes.length >= 10) {
    runes.shift();
  }
  runes.push(rune);
  res.json(rune);
});

app.get('/api/runes/:id', (req, res) => {
  const rune = runes.find(r => r.id === req.params.id);
  if (!rune) return res.status(404).json({ error: 'Rune not found' });
  res.json(rune);
});

app.put('/api/runes/:id', (req, res) => {
  const idx = runes.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Rune not found' });
  runes[idx] = { ...runes[idx], ...req.body, updatedAt: new Date().toISOString() };
  res.json(runes[idx]);
});

app.delete('/api/runes/:id', (req, res) => {
  runes = runes.filter(r => r.id !== req.params.id);
  res.json({ success: true });
});

app.get('/api/battles', (req, res) => {
  res.json(battles);
});

app.post('/api/battles', (req, res) => {
  const battle = {
    id: uuidv4(),
    ...req.body,
    createdAt: new Date().toISOString()
  };
  battles.push(battle);
  res.json(battle);
});

app.get('/api/battles/:id', (req, res) => {
  const battle = battles.find(b => b.id === req.params.id);
  if (!battle) return res.status(404).json({ error: 'Battle not found' });
  res.json(battle);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
