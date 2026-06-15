import express from 'express';
import cors from 'cors';
import { diffChars } from 'diff';
import { v4 as uuidv4 } from 'uuid';
import type { DiffRequest, DiffChunk } from './types';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.post('/api/diff', (req, res) => {
  try {
    const startTime = performance.now();
    const { oldText, newText }: DiffRequest = req.body;

    if (typeof oldText !== 'string' || typeof newText !== 'string') {
      res.status(400).json({ error: 'oldText 和 newText 必须为字符串' });
      return;
    }

    const changes = diffChars(oldText, newText);

    const chunks: DiffChunk[] = changes.map((part) => ({
      id: uuidv4(),
      operation: part.added ? 'insert' : part.removed ? 'delete' : 'equal',
      value: part.value,
      accepted: undefined,
    }));

    const elapsed = performance.now() - startTime;
    console.log(`[后端] 差异计算完成: ${elapsed.toFixed(2)}ms, 分块数: ${chunks.length}`);

    if (elapsed > 100) {
      console.warn(`[后端] 警告: 差异计算超过100ms (${elapsed.toFixed(2)}ms)`);
    }

    res.json({ chunks, computeTimeMs: elapsed });
  } catch (err) {
    console.error('[后端] 计算差异失败:', err);
    res.status(500).json({ error: '内部服务器错误' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`差异计算服务已启动: http://localhost:${PORT}`);
  console.log(`  POST /api/diff  - 计算文本差异`);
  console.log(`  GET  /api/health - 健康检查`);
});
