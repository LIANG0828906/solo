import express, { type Request, type Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MATERIALS, FACILITIES, RECIPES } from './data/recipes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, 'data');
const GAME_STATE_FILE = path.join(DATA_DIR, 'gameState.json');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

app.get('/api/recipes', (req: Request, res: Response<ApiResponse>) => {
  res.json({
    success: true,
    data: {
      materials: MATERIALS,
      facilities: FACILITIES,
      recipes: RECIPES,
    },
  });
});

app.post('/api/game/save', async (req: Request, res: Response<ApiResponse>) => {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const gameState = req.body;
    await fs.writeFile(GAME_STATE_FILE, JSON.stringify(gameState, null, 2), 'utf-8');
    res.json({
      success: true,
      message: '游戏状态已保存',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '保存游戏状态失败',
    });
  }
});

app.post('/api/game/load', async (req: Request, res: Response<ApiResponse>) => {
  try {
    await fs.access(GAME_STATE_FILE);
    const content = await fs.readFile(GAME_STATE_FILE, 'utf-8');
    const gameState = JSON.parse(content);
    res.json({
      success: true,
      data: gameState,
    });
  } catch {
    res.json({
      success: false,
      message: '游戏存档不存在',
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
