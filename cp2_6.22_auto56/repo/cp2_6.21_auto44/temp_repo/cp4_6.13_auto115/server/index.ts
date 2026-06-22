import express from 'express';
import http from 'http';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  createSurvey,
  updateSurvey,
  getSurvey,
  getAllSurveys,
  createResponse,
  getResponsesWithAnswers,
  getResponseCount
} from './database';
import { initWebSocket, broadcastNewResponse } from './websocket';

const app = express();
const server = http.createServer(app);
const PORT = 3001;

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'dist')));

function checkAuth(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.status(401).json({ error: '未授权' });
    return;
  }
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
  const [username, password] = credentials.split(':');
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    next();
  } else {
    res.status(401).json({ error: '用户名或密码错误' });
  }
}

app.post('/api/auth/login', checkAuth, (req, res) => {
  res.json({ success: true });
});

app.post('/api/surveys', checkAuth, (req, res) => {
  const { title, description, startTime, endTime, questions } = req.body;
  if (!title || !questions || questions.length === 0) {
    res.status(400).json({ error: '标题和题目不能为空' });
    return;
  }
  const id = uuidv4().slice(0, 8);
  createSurvey(id, title, description || '', startTime || null, endTime || null, questions);
  res.json({ id });
});

app.put('/api/surveys/:id', checkAuth, (req, res) => {
  const { id } = req.params;
  const { title, description, startTime, endTime, questions } = req.body;
  if (!title || !questions || questions.length === 0) {
    res.status(400).json({ error: '标题和题目不能为空' });
    return;
  }
  const existing = getSurvey(id);
  if (!existing) {
    res.status(404).json({ error: '问卷不存在' });
    return;
  }
  updateSurvey(id, title, description || '', startTime || null, endTime || null, questions);
  res.json({ success: true });
});

app.get('/api/surveys', checkAuth, (req, res) => {
  const surveys = getAllSurveys();
  res.json(surveys);
});

app.get('/api/surveys/:id', (req, res) => {
  const survey = getSurvey(req.params.id);
  if (!survey) {
    res.status(404).json({ error: '问卷不存在' });
    return;
  }
  res.json(survey);
});

app.get('/api/surveys/:id/stats', checkAuth, (req, res) => {
  const survey = getSurvey(req.params.id);
  if (!survey) {
    res.status(404).json({ error: '问卷不存在' });
    return;
  }
  const { responses, answers } = getResponsesWithAnswers(req.params.id);
  const count = getResponseCount(req.params.id);
  res.json({ survey, responses, answers, count });
});

app.post('/api/surveys/:id/responses', (req, res) => {
  const survey = getSurvey(req.params.id);
  if (!survey) {
    res.status(404).json({ error: '问卷不存在' });
    return;
  }

  const now = new Date();
  if (survey.start_time && new Date(survey.start_time) > now) {
    res.status(400).json({ error: '问卷尚未开始' });
    return;
  }
  if (survey.end_time && new Date(survey.end_time) < now) {
    res.status(400).json({ error: '问卷已截止' });
    return;
  }

  const { answers } = req.body;
  if (!answers || !Array.isArray(answers)) {
    res.status(400).json({ error: '答案格式错误' });
    return;
  }

  for (const q of survey.questions) {
    if (q.required) {
      const answer = answers.find((a: { questionId: string }) => a.questionId === q.id);
      if (!answer || !answer.answer || answer.answer === '[]') {
        res.status(400).json({ error: `题目"${q.title}"为必填项` });
        return;
      }
    }
  }

  const responseId = uuidv4();
  createResponse(responseId, req.params.id, answers);
  broadcastNewResponse(req.params.id);
  res.json({ success: true });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

initWebSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
