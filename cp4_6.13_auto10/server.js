const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
const CLIPS_FILE = path.join(DATA_DIR, 'clips.json');
const COMPOSITIONS_FILE = path.join(DATA_DIR, 'compositions.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJsonFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return [];
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
}

app.get('/api/clips', (req, res) => {
  const clips = readJsonFile(CLIPS_FILE);
  res.json(clips);
});

app.post('/api/clips', (req, res) => {
  const { name, instrument, duration, notes } = req.body;
  if (!name || !instrument || duration === undefined || !notes) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const clips = readJsonFile(CLIPS_FILE);
  const newClip = {
    id: uuidv4(),
    name,
    instrument,
    duration,
    createdAt: Date.now(),
    notes
  };
  clips.push(newClip);

  if (!writeJsonFile(CLIPS_FILE, clips)) {
    return res.status(500).json({ error: 'Failed to save clip' });
  }
  res.status(201).json(newClip);
});

app.delete('/api/clips/:id', (req, res) => {
  const { id } = req.params;
  const clips = readJsonFile(CLIPS_FILE);
  const index = clips.findIndex(clip => clip.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Clip not found' });
  }

  clips.splice(index, 1);
  if (!writeJsonFile(CLIPS_FILE, clips)) {
    return res.status(500).json({ error: 'Failed to delete clip' });
  }
  res.json({ message: 'Clip deleted successfully' });
});

app.get('/api/compositions', (req, res) => {
  const compositions = readJsonFile(COMPOSITIONS_FILE);
  res.json(compositions);
});

app.post('/api/compositions', (req, res) => {
  const { name, tracks } = req.body;
  if (!name || !tracks) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const compositions = readJsonFile(COMPOSITIONS_FILE);
  const newComposition = {
    id: uuidv4(),
    name,
    createdAt: Date.now(),
    tracks
  };
  compositions.push(newComposition);

  if (!writeJsonFile(COMPOSITIONS_FILE, compositions)) {
    return res.status(500).json({ error: 'Failed to save composition' });
  }
  res.status(201).json(newComposition);
});

app.put('/api/compositions/:id', (req, res) => {
  const { id } = req.params;
  const { name, tracks } = req.body;
  const compositions = readJsonFile(COMPOSITIONS_FILE);
  const index = compositions.findIndex(comp => comp.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Composition not found' });
  }

  compositions[index] = {
    ...compositions[index],
    name: name !== undefined ? name : compositions[index].name,
    tracks: tracks !== undefined ? tracks : compositions[index].tracks
  };

  if (!writeJsonFile(COMPOSITIONS_FILE, compositions)) {
    return res.status(500).json({ error: 'Failed to update composition' });
  }
  res.json(compositions[index]);
});

app.delete('/api/compositions/:id', (req, res) => {
  const { id } = req.params;
  const compositions = readJsonFile(COMPOSITIONS_FILE);
  const index = compositions.findIndex(comp => comp.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Composition not found' });
  }

  compositions.splice(index, 1);
  if (!writeJsonFile(COMPOSITIONS_FILE, compositions)) {
    return res.status(500).json({ error: 'Failed to delete composition' });
  }
  res.json({ message: 'Composition deleted successfully' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
