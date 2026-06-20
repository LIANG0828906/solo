import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3002;
const PRESETS_FILE = path.join(__dirname, 'presets.json');
const BUILTIN_PRESETS_FILE = path.join(__dirname, '..', 'src', 'utils', 'nebulaPresets.json');

app.use(cors());
app.use(bodyParser.json());

function readUserPresets() {
  try {
    if (fs.existsSync(PRESETS_FILE)) {
      const data = fs.readFileSync(PRESETS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading user presets:', e);
  }
  return [];
}

function writeUserPresets(presets) {
  try {
    fs.writeFileSync(PRESETS_FILE, JSON.stringify(presets, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('Error writing user presets:', e);
    return false;
  }
}

function readBuiltinPresets() {
  try {
    if (fs.existsSync(BUILTIN_PRESETS_FILE)) {
      const data = fs.readFileSync(BUILTIN_PRESETS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading builtin presets:', e);
  }
  return [];
}

app.get('/api/presets', (req, res) => {
  const builtin = readBuiltinPresets();
  const user = readUserPresets();
  res.json({ presets: [...builtin, ...user] });
});

app.post('/api/presets', (req, res) => {
  const { name, params } = req.body;
  if (!name || !params) {
    return res.status(400).json({ success: false, error: 'Missing name or params' });
  }
  const userPresets = readUserPresets();
  const newPreset = {
    id: uuidv4(),
    name,
    isBuiltIn: false,
    params,
    createdAt: Date.now(),
  };
  userPresets.push(newPreset);
  const ok = writeUserPresets(userPresets);
  if (ok) {
    res.json({ success: true, preset: newPreset });
  } else {
    res.status(500).json({ success: false, error: 'Failed to save preset' });
  }
});

if (!fs.existsSync(PRESETS_FILE)) {
  fs.writeFileSync(PRESETS_FILE, '[]', 'utf-8');
}

app.listen(PORT, () => {
  console.log(`Nebula API server running on http://localhost:${PORT}`);
});
