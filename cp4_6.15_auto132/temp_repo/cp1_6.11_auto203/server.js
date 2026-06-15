import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

const MAX_HISTORY = 5;
const gameHistory = [];

app.post('/api/score', (req, res) => {
  try {
    const { playerCount, scores } = req.body;

    if (!playerCount || !scores || !Array.isArray(scores)) {
      return res.status(400).json({
        success: false,
        message: '请求参数不完整'
      });
    }

    const record = {
      id: uuidv4(),
      timestamp: Date.now(),
      playerCount,
      scores
    };

    gameHistory.unshift(record);
    if (gameHistory.length > MAX_HISTORY) {
      gameHistory.pop();
    }

    res.json({ success: true, message: '得分已保存' });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: '服务器错误: ' + err.message
    });
  }
});

app.get('/api/score', (_req, res) => {
  try {
    res.json({
      success: true,
      data: [...gameHistory]
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: '服务器错误: ' + err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`[Touhu API] Server running on http://localhost:${PORT}`);
  console.log(`[Touhu API] POST /api/score - 保存得分`);
  console.log(`[Touhu API] GET  /api/score - 获取近5局历史`);
});
