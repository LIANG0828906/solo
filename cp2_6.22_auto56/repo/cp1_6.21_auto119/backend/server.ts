import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json());

interface ScreenshotRecord {
  id: string;
  fileName: string;
  code: string;
  language: string;
  theme: string;
  thumbnail: string;
  createdAt: string;
}

interface ThemePreset {
  id: string;
  name: string;
  background: string;
  keywordColor: string;
  toolbarColor: string;
  accentColor: string;
  isDark: boolean;
}

const screenshots: ScreenshotRecord[] = [];

const themePresets: ThemePreset[] = [
  {
    id: 'dracula',
    name: 'Dracula',
    background: '#282A36',
    keywordColor: '#FF79C6',
    toolbarColor: '#2D2D2D',
    accentColor: '#FF79C6',
    isDark: true,
  },
  {
    id: 'monokai',
    name: 'Monokai',
    background: '#272822',
    keywordColor: '#F92672',
    toolbarColor: '#2D2D2D',
    accentColor: '#F92672',
    isDark: true,
  },
  {
    id: 'nord',
    name: 'Nord',
    background: '#2E3440',
    keywordColor: '#88C0D0',
    toolbarColor: '#2D2D2D',
    accentColor: '#88C0D0',
    isDark: true,
  },
  {
    id: 'solarized-light',
    name: 'Solarized Light',
    background: '#FDF6E3',
    keywordColor: '#859900',
    toolbarColor: '#EEE8D5',
    accentColor: '#859900',
    isDark: false,
  },
];

app.get('/api/presets', (req, res) => {
  res.json(themePresets);
});

app.get('/api/screenshots', (req, res) => {
  const recent = screenshots.slice(-10).reverse();
  res.json(recent);
});

app.post('/api/screenshots', (req, res) => {
  const { fileName, code, language, theme, thumbnail } = req.body;
  if (!fileName || !code || !language || !theme) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  const record: ScreenshotRecord = {
    id: uuidv4(),
    fileName,
    code,
    language,
    theme,
    thumbnail: thumbnail || '',
    createdAt: new Date().toISOString(),
  };
  screenshots.push(record);
  if (screenshots.length > 50) {
    screenshots.shift();
  }
  res.status(201).json(record);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
