import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Poem, SearchResponse, DetailResponse, ImageMatchResult } from '../shared/types';
import { matchImage, matchThumbnail } from './imageMatch.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let poemsData: Poem[] = [];

const loadPoemsData = (): void => {
  try {
    const dataPath = path.join(__dirname, 'data', 'poems.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    poemsData = JSON.parse(rawData) as Poem[];
    console.log(`Loaded ${poemsData.length} poems from data file`);
  } catch (error) {
    console.error('Error loading poems data:', error);
    poemsData = [];
  }
};

loadPoemsData();

const dynastyOrder: Record<string, number> = {
  '先秦': 1,
  '汉': 2,
  '三国': 3,
  '晋': 4,
  '南北朝': 5,
  '隋': 6,
  '唐': 7,
  '五代': 8,
  '宋': 9,
  '辽': 10,
  '金': 11,
  '元': 12,
  '明': 13,
  '清': 14,
  '近代': 15,
  '现代': 16,
};

const searchPoems = (
  keyword: string,
  style?: string,
  sortOrder: 'asc' | 'desc' = 'asc'
): (Poem & { thumbnail: ImageMatchResult })[] => {
  let results = poemsData.filter(poem => {
    if (!keyword) return true;
    
    const keywordLower = keyword.toLowerCase();
    const titleMatch = poem.title.toLowerCase().includes(keywordLower);
    const authorMatch = poem.author.toLowerCase().includes(keywordLower);
    const contentMatch = poem.content.some(line => line.includes(keyword));
    const keywordMatch = poem.keywords.some(kw => kw.includes(keyword));
    
    return titleMatch || authorMatch || contentMatch || keywordMatch;
  });
  
  if (style && style !== '全部') {
    results = results.filter(poem => poem.style.includes(style));
  }
  
  results.sort((a, b) => {
    const orderA = dynastyOrder[a.dynasty] ?? 99;
    const orderB = dynastyOrder[b.dynasty] ?? 99;
    
    if (sortOrder === 'asc') {
      return orderA - orderB;
    } else {
      return orderB - orderA;
    }
  });
  
  return results.map(poem => {
    const thumbnail = matchThumbnail(
      poem.content.join(''),
      poem.keywords,
      poem.style
    );
    return { ...poem, thumbnail };
  });
};

app.get('/api/poems/search', (req, res) => {
  const startTime = Date.now();
  
  try {
    const { keyword, style, sortOrder } = req.query;
    
    const keywordStr = typeof keyword === 'string' ? keyword : '';
    const styleStr = typeof style === 'string' ? style : undefined;
    const sortOrderStr = typeof sortOrder === 'string' && (sortOrder === 'asc' || sortOrder === 'desc')
      ? sortOrder
      : 'asc';
    
    const poems = searchPoems(keywordStr, styleStr, sortOrderStr);
    
    const response: SearchResponse = {
      poems,
      total: poems.length,
    };
    
    const elapsed = Date.now() - startTime;
    console.log(`Search completed in ${elapsed}ms, found ${poems.length} results`);
    
    res.json(response);
  } catch (error) {
    console.error('Error in search endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/poems/detail/:id', (req, res) => {
  const startTime = Date.now();
  
  try {
    const { id } = req.params;
    
    const poem = poemsData.find(p => p.id === id);
    
    if (!poem) {
      res.status(404).json({ error: 'Poem not found' });
      return;
    }
    
    const fullImage = matchImage(
      poem.content.join(''),
      poem.keywords,
      poem.style
    );
    
    const response: DetailResponse = {
      poem,
      fullImage,
    };
    
    const elapsed = Date.now() - startTime;
    console.log(`Detail request completed in ${elapsed}ms for poem id ${id}`);
    
    res.json(response);
  } catch (error) {
    console.error('Error in detail endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', poemsCount: poemsData.length });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  GET /api/poems/search?keyword=...&style=...&sortOrder=...`);
  console.log(`  GET /api/poems/detail/:id`);
  console.log(`  GET /api/health`);
});

export default app;
