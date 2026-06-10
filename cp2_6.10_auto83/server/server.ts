import express from 'express';
import cors from 'cors';
import { mockCases } from './data/cases';
import { mockLaws } from './data/laws';
import { validateJudgement, submitJudgement } from './services/judgementService';
import type { ValidateRequest, SubmitRequest } from '@/types';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/cases', (_req, res) => {
  res.json(mockCases);
});

app.get('/api/cases/:id', (req, res) => {
  const caseData = mockCases.find(c => c.id === req.params.id);
  if (caseData) {
    res.json(caseData);
  } else {
    res.status(404).json({ error: 'Case not found' });
  }
});

app.get('/api/laws', (_req, res) => {
  res.json(mockLaws);
});

app.get('/api/laws/search', (req, res) => {
  const keyword = (req.query.keyword as string) || '';
  if (!keyword) {
    return res.json(mockLaws);
  }
  
  const results = mockLaws.filter(law => 
    law.title.includes(keyword) ||
    law.content.includes(keyword) ||
    law.keywords.some(k => k.includes(keyword))
  );
  
  res.json(results);
});

app.get('/api/laws/:id', (req, res) => {
  const law = mockLaws.find(l => l.id === req.params.id);
  if (law) {
    res.json(law);
  } else {
    res.status(404).json({ error: 'Law not found' });
  }
});

app.post('/api/judgement/validate', (req, res) => {
  const request: ValidateRequest = req.body;
  const result = validateJudgement(request);
  res.json(result);
});

app.post('/api/judgement/submit', (req, res) => {
  const request: SubmitRequest = req.body;
  const result = submitJudgement(request);
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
