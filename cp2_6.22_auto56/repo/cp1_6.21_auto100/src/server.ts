import express from 'express';
import cors from 'cors';
import { parseData } from './dataParser';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.post('/api/parse', async (req, res) => {
  try {
    const { rawText, csvContent } = req.body;
    
    if (!rawText && !csvContent) {
      return res.status(400).json({
        success: false,
        error: '请提供数值文本或CSV内容'
      });
    }
    
    const result = await parseData({ rawText, csvContent });
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    console.error('Parse error:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误'
    });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`POST /api/parse - Parse text or CSV data`);
  console.log(`GET  /api/health - Health check`);
});

export default app;
