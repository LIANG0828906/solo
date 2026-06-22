const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { readFileSync, writeFileSync } = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'events.json');

const app = express();
app.use(cors());
app.use(express.json());

function readEvents() {
  try {
    const data = readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeEvents(events) {
  writeFileSync(DATA_FILE, JSON.stringify(events, null, 2), 'utf-8');
}

app.get('/api/events', (req, res) => {
  const events = readEvents();
  res.json(events);
});

app.post('/api/events', (req, res) => {
  const { title, date, lat, lng, description, category, importance } = req.body;
  if (!title || !date || lat == null || lng == null) {
    return res.status(400).json({ error: '缺少必填字段' });
  }
  const events = readEvents();
  const newEvent = {
    id: uuidv4(),
    title,
    date,
    lat: Number(lat),
    lng: Number(lng),
    description: description || '',
    category: category || 'culture',
    importance: importance || 3,
  };
  events.push(newEvent);
  writeEvents(events);
  res.status(201).json(newEvent);
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
