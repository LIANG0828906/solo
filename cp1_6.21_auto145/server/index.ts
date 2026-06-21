import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { Diary } from '../src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'diaries.json');

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json());

interface DiaryData {
  diaries: Diary[];
}

const ensureDataFile = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ diaries: [] }, null, 2), 'utf-8');
  }
};

const readDiaries = (): DiaryData => {
  ensureDataFile();
  try {
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return { diaries: [] };
  }
};

const writeDiaries = (data: DiaryData) => {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
};

const sortDiaries = (diaries: Diary[]): Diary[] => {
  return [...diaries].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date > b.date ? -1 : 1;
    }
    return b.createdAt - a.createdAt;
  });
};

app.get('/api/diaries', (_req: Request, res: Response) => {
  try {
    const data = readDiaries();
    const sortedDiaries = sortDiaries(data.diaries);
    res.json({ data: sortedDiaries });
  } catch (error) {
    console.error('Error reading diaries:', error);
    res.status(500).json({ error: 'Failed to read diaries' });
  }
});

app.post('/api/diaries', (req: Request, res: Response) => {
  try {
    const { date, mood, content } = req.body;

    if (!date || !mood || !content) {
      return res.status(400).json({ 
        error: 'Missing required fields: date, mood, and content are required' 
      });
    }

    const validMoods = ['happy', 'calm', 'sad', 'anxious', 'creative'];
    if (!validMoods.includes(mood)) {
      return res.status(400).json({ 
        error: 'Invalid mood type. Must be one of: happy, calm, sad, anxious, creative' 
      });
    }

    const newDiary: Diary = {
      id: uuidv4(),
      date,
      mood: mood as Diary['mood'],
      content: String(content),
      createdAt: Date.now(),
    };

    const data = readDiaries();
    data.diaries.push(newDiary);
    writeDiaries(data);

    res.status(201).json({ 
      success: true, 
      data: newDiary 
    });
  } catch (error) {
    console.error('Error creating diary:', error);
    res.status(500).json({ error: 'Failed to create diary' });
  }
});

app.listen(PORT, () => {
  console.log(`✨ 灵感星图后端服务已启动: http://localhost:${PORT}`);
  console.log(`📁 数据文件位置: ${DATA_FILE}`);
});
