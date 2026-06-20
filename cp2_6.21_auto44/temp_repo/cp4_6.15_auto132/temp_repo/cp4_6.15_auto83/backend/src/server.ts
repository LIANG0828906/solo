import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { moods, moodSongs, type Song } from './data/moodSongs.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

console.log('正在初始化情绪与歌曲数据...');

app.get('/api/moods', (req: Request, res: Response) => {
  res.json(moods);
});

interface PredictMoodRequest {
  text?: string;
  mood?: string;
}

interface PredictMoodResponse {
  emotion: string;
  confidence: number;
}

app.post('/api/predict-mood', (req: Request<{}, {}, PredictMoodRequest>, res: Response<PredictMoodResponse>) => {
  const { text, mood } = req.body;

  if (mood) {
    res.json({ emotion: mood, confidence: 1.0 });
    return;
  }

  let emotion = 'calm';

  if (text) {
    const happyKeywords = ['开心', '快乐', '高兴', '振奋', '棒', 'happy', 'joy', 'great'];
    const sadKeywords = ['悲伤', '难过', '哭', '失落', 'sad', 'cry', 'down'];
    const relaxedKeywords = ['放松', '舒服', '休息', '平静', 'relax', 'rest', 'calm'];
    const anxiousKeywords = ['焦虑', '紧张', '担心', '压力', 'anxious', 'stress', 'worry'];
    const excitedKeywords = ['兴奋', '激动', '嗨', '燃', 'excited', 'wow', 'awesome'];

    if (happyKeywords.some((kw) => text.includes(kw))) {
      emotion = 'happy';
    } else if (sadKeywords.some((kw) => text.includes(kw))) {
      emotion = 'sad';
    } else if (relaxedKeywords.some((kw) => text.includes(kw))) {
      emotion = 'relaxed';
    } else if (anxiousKeywords.some((kw) => text.includes(kw))) {
      emotion = 'anxious';
    } else if (excitedKeywords.some((kw) => text.includes(kw))) {
      emotion = 'excited';
    }
  }

  const confidence = 0.7 + Math.random() * 0.25;
  res.json({ emotion, confidence });
});

interface RecommendRequest {
  mood: string;
}

app.post('/api/recommend', (req: Request<{}, {}, RecommendRequest>, res: Response<Song[]>) => {
  const { mood } = req.body;
  const songs = moodSongs.get(mood) || [];

  if (songs.length === 0) {
    res.json([]);
    return;
  }

  const shuffled = [...songs].sort(() => Math.random() - 0.5);
  const count = Math.floor(Math.random() * 3) + 6;
  const result = shuffled.slice(0, Math.min(count, shuffled.length));

  res.json(result);
});

app.listen(PORT, () => {
  console.log(`🎵 情绪音乐推荐服务器已启动`);
  console.log(`📡 服务器地址: http://localhost:${PORT}`);
  console.log(`📋 可用 API:`);
  console.log(`   GET  /api/moods       - 获取所有情绪列表`);
  console.log(`   POST /api/predict-mood - 预测情绪`);
  console.log(`   POST /api/recommend    - 获取歌曲推荐`);
  console.log(`✅ 数据初始化完成，已加载 ${moods.length} 种情绪，${moodSongs.size * 8} 首歌曲`);
});

export default app;
