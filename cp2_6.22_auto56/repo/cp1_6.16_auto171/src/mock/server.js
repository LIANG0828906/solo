import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const templates = new Map();
const responses = new Map();

app.post('/api/template', (req, res) => {
  const { title, description, questions } = req.body;
  
  if (!title || !questions || questions.length === 0) {
    return res.status(400).json({ error: '问卷标题和题目不能为空' });
  }

  const template = {
    id: uuidv4(),
    title,
    description,
    questions,
    createdAt: new Date().toISOString(),
  };

  templates.set(template.id, template);
  responses.set(template.id, []);

  console.log(`问卷模板已保存: ${template.id}`);
  res.json(template);
});

app.get('/api/template/:id', (req, res) => {
  const template = templates.get(req.params.id);
  
  if (!template) {
    return res.status(404).json({ error: '问卷不存在' });
  }

  res.json(template);
});

app.post('/api/response', (req, res) => {
  const { templateId, answers } = req.body;
  
  if (!templateId || !answers) {
    return res.status(400).json({ error: '提交数据不完整' });
  }

  if (!templates.has(templateId)) {
    return res.status(404).json({ error: '问卷不存在' });
  }

  const response = {
    id: uuidv4(),
    templateId,
    answers,
    submittedAt: new Date().toISOString(),
  };

  const templateResponses = responses.get(templateId) || [];
  templateResponses.push(response);
  responses.set(templateId, templateResponses);

  console.log(`收到答卷: ${response.id} (模板: ${templateId})`);
  res.json(response);
});

app.get('/api/results/:templateId', (req, res) => {
  const { templateId } = req.params;
  const template = templates.get(templateId);
  
  if (!template) {
    return res.status(404).json({ error: '问卷不存在' });
  }

  const templateResponses = responses.get(templateId) || [];
  
  const analysisResults = template.questions.map((question) => {
    const result = {
      questionId: question.id,
      questionTitle: question.title,
      questionType: question.type,
      stats: {
        totalResponses: templateResponses.length,
      },
    };

    const answersForQuestion = templateResponses
      .map((r) => r.answers.find((a) => a.questionId === question.id)?.value)
      .filter((v) => v !== undefined);

    if (question.type === 'single' || question.type === 'multiple') {
      const counts = {};
      question.options?.forEach((opt) => {
        counts[opt.label] = 0;
      });

      answersForQuestion.forEach((value) => {
        if (Array.isArray(value)) {
          value.forEach((v) => {
            counts[v] = (counts[v] || 0) + 1;
          });
        } else if (typeof value === 'string') {
          counts[value] = (counts[value] || 0) + 1;
        }
      });

      const percentages = {};
      const total = answersForQuestion.length;
      Object.entries(counts).forEach(([key, count]) => {
        percentages[key] = total > 0 ? Math.round((count / total) * 100 * 10) / 10 : 0;
      });

      result.stats.counts = counts;
      result.stats.percentages = percentages;
    } else if (question.type === 'rating') {
      const numericAnswers = answersForQuestion.filter((v) => typeof v === 'number');
      const sum = numericAnswers.reduce((a, b) => a + b, 0);
      result.stats.mean = numericAnswers.length > 0 ? Math.round((sum / numericAnswers.length) * 10) / 10 : 0;
      
      const counts = {};
      for (let i = 1; i <= 5; i++) {
        counts[`${i}分`] = numericAnswers.filter((v) => v === i).length;
      }
      result.stats.counts = counts;
    }

    return result;
  });

  res.json({
    template,
    responses: templateResponses,
    analysis: analysisResults,
  });
});

app.listen(PORT, () => {
  console.log(`模拟后端服务器运行在 http://localhost:${PORT}`);
});
