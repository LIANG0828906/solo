import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import {
  getSurveys,
  getSurvey,
  createSurvey,
  updateSurvey,
  deleteSurvey,
  publishSurvey,
  createSubmission,
  getSurveyResults,
} from './dataStore.js';
import type {
  Survey,
  SurveyCreateInput,
  SubmissionCreateInput,
} from '../shared/types.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

function responseTimeLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  res.json = ((body: unknown): Response => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.path} - ${res.statusCode} - ${duration}ms`);
    return originalJson(body);
  }) as typeof res.json;

  res.send = ((body: unknown): Response => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.path} - ${res.statusCode} - ${duration}ms`);
    return originalSend(body);
  }) as typeof res.send;

  next();
}

app.use(responseTimeLogger);

app.get('/api/surveys', (_req: Request, res: Response): void => {
  const surveys = getSurveys();
  res.json({ success: true, data: surveys });
});

app.get('/api/surveys/:id', (req: Request, res: Response): void => {
  const survey = getSurvey(req.params.id);
  if (!survey) {
    res.status(404).json({ success: false, error: '问卷不存在' });
    return;
  }
  res.json({ success: true, data: survey });
});

app.post('/api/surveys', (req: Request, res: Response): void => {
  const { title, description, questions } = req.body as Partial<SurveyCreateInput>;

  if (!title || !questions) {
    res.status(400).json({ success: false, error: '标题和问题为必填项' });
    return;
  }

  const survey = createSurvey({
    title,
    description: description || '',
    questions,
  });

  res.status(201).json({ success: true, data: survey });
});

app.put('/api/surveys/:id', (req: Request, res: Response): void => {
  const survey = updateSurvey(req.params.id, req.body);
  if (!survey) {
    res.status(404).json({ success: false, error: '问卷不存在' });
    return;
  }
  res.json({ success: true, data: survey });
});

app.delete('/api/surveys/:id', (req: Request, res: Response): void => {
  const deleted = deleteSurvey(req.params.id);
  if (!deleted) {
    res.status(404).json({ success: false, error: '问卷不存在' });
    return;
  }
  res.json({ success: true, message: '删除成功' });
});

app.post('/api/surveys/:id/publish', (req: Request, res: Response): void => {
  const survey = publishSurvey(req.params.id);
  if (!survey) {
    res.status(404).json({ success: false, error: '问卷不存在' });
    return;
  }
  res.json({ success: true, data: survey });
});

app.post('/api/submissions', (req: Request, res: Response): void => {
  const submissionData = req.body as SubmissionCreateInput;
  const survey = getSurvey(submissionData.surveyId);

  if (!survey) {
    res.status(404).json({ success: false, error: '问卷不存在' });
    return;
  }

  if (!survey.published) {
    res.status(400).json({ success: false, error: '问卷未发布' });
    return;
  }

  for (const question of survey.questions) {
    if (question.required) {
      const answer = submissionData.answers.find(a => a.questionId === question.id);
      if (!answer) {
        res.status(400).json({ success: false, error: `必填问题"${question.title}"未填写` });
        return;
      }
      if (answer.value === undefined || answer.value === null) {
        res.status(400).json({ success: false, error: `必填问题"${question.title}"未填写` });
        return;
      }
      if (typeof answer.value === 'string' && answer.value.trim() === '') {
        res.status(400).json({ success: false, error: `必填问题"${question.title}"未填写` });
        return;
      }
      if (Array.isArray(answer.value) && answer.value.length === 0) {
        res.status(400).json({ success: false, error: `必填问题"${question.title}"未填写` });
        return;
      }
    }
  }

  const result = createSubmission(submissionData);
  if (!result) {
    res.status(404).json({ success: false, error: '提交失败' });
    return;
  }

  res.status(201).json({ success: true, data: result });
});

app.get('/api/surveys/:id/results', (req: Request, res: Response): void => {
  const { startTime, endTime } = req.query;

  const startTimeDate = startTime ? new Date(parseInt(startTime as string, 10)) : undefined;
  const endTimeDate = endTime ? new Date(parseInt(endTime as string, 10)) : undefined;

  const results = getSurveyResults(req.params.id, startTimeDate, endTimeDate);
  if (!results) {
    res.status(404).json({ success: false, error: '问卷不存在' });
    return;
  }

  res.json({ success: true, data: results });
});

app.get('/api/surveys/:id/export', (req: Request, res: Response): void => {
  const { startTime, endTime } = req.query;

  const startTimeDate = startTime ? new Date(parseInt(startTime as string, 10)) : undefined;
  const endTimeDate = endTime ? new Date(parseInt(endTime as string, 10)) : undefined;

  const survey = getSurvey(req.params.id);
  const results = getSurveyResults(req.params.id, startTimeDate, endTimeDate);

  if (!survey || !results) {
    res.status(404).json({ success: false, error: '问卷不存在' });
    return;
  }

  const escapeCsv = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const headers = ['问题', '选项/答案', '计数'];
  const rows: string[][] = [];

  for (const questionStats of results.questionStats) {
    if (questionStats.optionCounts) {
      for (const [option, count] of Object.entries(questionStats.optionCounts)) {
        rows.push([questionStats.questionTitle, option, String(count)]);
      }
    } else if (questionStats.averageRating !== undefined) {
      rows.push([questionStats.questionTitle, '平均分', String(questionStats.averageRating)]);
    } else if (questionStats.textResponses) {
      for (const text of questionStats.textResponses) {
        rows.push([questionStats.questionTitle, text, '1']);
      }
    }
    rows.push(['', '', '']);
  }

  const csvContent = [
    headers.map(escapeCsv).join(','),
    ...rows.map(row => row.map(escapeCsv).join(',')),
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="survey_${survey.id}_${Date.now()}.csv"`);
  res.write('\uFEFF');
  res.send(csvContent);
});

app.use((error: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error('服务器错误:', error);
  res.status(500).json({
    success: false,
    error: '服务器内部错误',
  });
});

app.use((_req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: 'API不存在',
  });
});

const server = app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

process.on('SIGTERM', () => {
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  server.close(() => {
    process.exit(0);
  });
});
