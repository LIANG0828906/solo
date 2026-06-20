import express from 'express';
import cors from 'cors';
import { parseText, GraphData } from './knowledgeParser.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.post('/api/generate', (req, res) => {
  try {
    const { text } = req.body as { text: string };
    
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: '请提供有效的文本内容' });
      return;
    }
    
    if (text.trim().length < 300) {
      res.status(400).json({ error: '文本内容不足300字，请输入更多内容' });
      return;
    }
    
    const graphData: GraphData = parseText(text);
    
    if (graphData.nodes.length < 10) {
      res.status(400).json({ 
        error: '提取的概念数量不足，请尝试输入包含更多专业术语的文本' 
      });
      return;
    }
    
    res.json(graphData);
  } catch (error) {
    console.error('Error processing text:', error);
    res.status(500).json({ error: '服务器处理错误，请稍后重试' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`知识图谱服务器运行在 http://localhost:${PORT}`);
});