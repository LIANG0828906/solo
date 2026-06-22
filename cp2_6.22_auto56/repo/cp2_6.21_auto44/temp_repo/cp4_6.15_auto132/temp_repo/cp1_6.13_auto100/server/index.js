import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

function validateQuestionnaire(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('问卷数据格式错误');
  }
  if (!data.title || typeof data.title !== 'string') {
    throw new Error('问卷缺少标题');
  }
  if (!Array.isArray(data.questions) || data.questions.length === 0) {
    throw new Error('问卷缺少问题列表');
  }

  const validTypes = ['single', 'multiple', 'text', 'rating'];

  data.questions.forEach((q, index) => {
    if (!q.id || typeof q.id !== 'string') {
      throw new Error(`问题${index + 1}缺少有效ID`);
    }
    if (!validTypes.includes(q.type)) {
      throw new Error(`问题${q.id}类型无效，必须是single/multiple/text/rating`);
    }
    if (!q.title || typeof q.title !== 'string') {
      throw new Error(`问题${q.id}缺少标题`);
    }
    if (['single', 'multiple'].includes(q.type) && (!Array.isArray(q.options) || q.options.length === 0)) {
      throw new Error(`问题${q.id}缺少选项列表`);
    }
    if (q.options) {
      q.options.forEach((opt, i) => {
        if (!opt.value || !opt.label) {
          throw new Error(`问题${q.id}的选项${i + 1}缺少value或label`);
        }
      });
    }
  });

  return true;
}

app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传文件' });
    }

    let data;
    try {
      data = JSON.parse(req.file.buffer.toString('utf8'));
    } catch (e) {
      return res.status(400).json({ error: 'JSON文件解析失败，请检查格式' });
    }

    validateQuestionnaire(data);

    res.json({
      success: true,
      message: '问卷解析成功',
      data: {
        title: data.title,
        description: data.description || '',
        questions: data.questions.map(q => ({
          id: q.id,
          type: q.type,
          title: q.title,
          description: q.description || '',
          options: q.options || [],
          skipLogic: q.skipLogic || [],
          required: q.required !== false
        }))
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/export', (req, res) => {
  try {
    const { answers, title } = req.body;

    if (!answers || typeof answers !== 'object') {
      return res.status(400).json({ error: '答案数据格式错误' });
    }

    const exportData = {
      title: title || '问卷答案',
      exportTime: new Date().toISOString(),
      answers: answers
    };

    const jsonStr = JSON.stringify(exportData, null, 2);
    const filename = `questionnaire_answers_${Date.now()}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(jsonStr);
  } catch (error) {
    res.status(500).json({ error: '导出失败: ' + error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`后端服务运行在 http://localhost:${PORT}`);
});
