import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import { scoreText } from './scoringEngine';
import {
  getRules,
  addRule,
  updateRule,
  deleteRule,
  saveGradingResult,
  getHistory,
  getGradingById
} from './database';
import { Rule } from './types';

const app = express();
const PORT = 3001;

app.use(express.json());
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.txt', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('只支持上传 .txt 和 .pdf 格式的文件'));
    }
  }
});

app.post('/api/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传文件' });
    }

    const filePath = req.file.path;
    const originalName = req.file.originalname;
    const ext = path.extname(originalName).toLowerCase();

    let text = '';

    try {
      if (ext === '.pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const pdfResult = await pdfParse(dataBuffer);
        text = pdfResult.text;
        if (!text || text.trim().length === 0) {
          return res.status(400).json({ error: '报告格式不正确' });
        }
      } else if (ext === '.txt') {
        text = fs.readFileSync(filePath, 'utf-8');
      }
    } catch (err) {
      return res.status(400).json({ error: '报告格式不正确' });
    } finally {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    const rules = getRules();
    const results = scoreText(text, rules);

    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const maxScore = results.reduce((sum, r) => sum + r.maxScore, 0);

    const gradingResult = saveGradingResult(originalName, totalScore, maxScore, results);

    return res.json(gradingResult);
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: '服务器内部错误' });
  }
});

app.get('/api/rules', (req: Request, res: Response) => {
  try {
    const rules = getRules();
    return res.json(rules);
  } catch (err) {
    console.error('Get rules error:', err);
    return res.status(500).json({ error: '获取规则失败' });
  }
});

app.post('/api/rules', (req: Request, res: Response) => {
  try {
    const { name, type, pattern, weight, suggestion } = req.body;

    if (!name || !type || !['keyword', 'format', 'formula'].includes(type) ||
        weight === undefined || !suggestion) {
      return res.status(400).json({ error: '缺少必要的规则参数' });
    }

    const newRule = addRule({
      name,
      type: type as 'keyword' | 'format' | 'formula',
      pattern: pattern || '',
      weight: Number(weight),
      suggestion
    });

    return res.status(201).json(newRule);
  } catch (err) {
    console.error('Add rule error:', err);
    return res.status(500).json({ error: '添加规则失败' });
  }
});

app.put('/api/rules/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, type, pattern, weight, suggestion } = req.body;

    const updateData: Partial<Omit<Rule, 'id'>> = {};
    if (name !== undefined) updateData.name = name;
    if (type !== undefined && ['keyword', 'format', 'formula'].includes(type)) {
      updateData.type = type as 'keyword' | 'format' | 'formula';
    }
    if (pattern !== undefined) updateData.pattern = pattern;
    if (weight !== undefined) updateData.weight = Number(weight);
    if (suggestion !== undefined) updateData.suggestion = suggestion;

    const updatedRule = updateRule(id, updateData);
    if (!updatedRule) {
      return res.status(404).json({ error: '规则不存在' });
    }

    return res.json(updatedRule);
  } catch (err) {
    console.error('Update rule error:', err);
    return res.status(500).json({ error: '更新规则失败' });
  }
});

app.delete('/api/rules/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = deleteRule(id);
    if (!deleted) {
      return res.status(404).json({ error: '规则不存在' });
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('Delete rule error:', err);
    return res.status(500).json({ error: '删除规则失败' });
  }
});

app.get('/api/history', (req: Request, res: Response) => {
  try {
    const history = getHistory();
    return res.json(history);
  } catch (err) {
    console.error('Get history error:', err);
    return res.status(500).json({ error: '获取历史记录失败' });
  }
});

app.get('/api/history/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const record = getGradingById(id);
    if (!record) {
      return res.status(404).json({ error: '记录不存在' });
    }
    return res.json(record);
  } catch (err) {
    console.error('Get grading detail error:', err);
    return res.status(500).json({ error: '获取评分详情失败' });
  }
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.message);
  if (err.message.includes('只支持上传')) {
    return res.status(400).json({ error: err.message });
  }
  if (err.message.includes('File too large')) {
    return res.status(400).json({ error: '文件大小不能超过10MB' });
  }
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`AutoLab backend server is running on port ${PORT}`);
});
