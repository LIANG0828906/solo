import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

interface Question {
  type: 'single' | 'multiple' | 'rating';
  id: string;
  title: string;
  options?: string[];
  maxRating?: number;
  required?: boolean;
}

interface Survey {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  isPublished: boolean;
  createdAt: number;
  publishedAt?: number;
}

interface ResponseAnswer {
  questionId: string;
  value: string | string[] | number;
}

interface SurveyResponse {
  id: string;
  surveyId: string;
  answers: ResponseAnswer[];
  submittedAt: number;
  completionTime: number;
}

interface DataStore {
  surveys: Survey[];
  responses: SurveyResponse[];
}

const DATA_FILE = path.join(__dirname, 'data.json');

let data: DataStore = { surveys: [], responses: [] };

const loadData = () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      data = JSON.parse(raw);
    }
  } catch {
    data = { surveys: [], responses: [] };
  }
};

const saveData = () => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
};

loadData();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/surveys', (_req: Request, res: Response) => {
  res.json(data.surveys);
});

app.post('/api/surveys', (req: Request, res: Response) => {
  const { title, description, questions } = req.body;
  const survey: Survey = {
    id: uuidv4(),
    title,
    description,
    questions,
    isPublished: false,
    createdAt: Date.now(),
  };
  data.surveys.push(survey);
  saveData();
  res.status(201).json(survey);
});

app.get('/api/surveys/:id', (req: Request, res: Response) => {
  const survey = data.surveys.find(s => s.id === req.params.id);
  if (!survey) {
    res.status(404).json({ error: 'Survey not found' });
    return;
  }
  res.json(survey);
});

app.put('/api/surveys/:id', (req: Request, res: Response) => {
  const index = data.surveys.findIndex(s => s.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Survey not found' });
    return;
  }
  if (data.surveys[index].isPublished) {
    res.status(400).json({ error: 'Published survey cannot be updated' });
    return;
  }
  data.surveys[index] = { ...data.surveys[index], ...req.body, id: data.surveys[index].id };
  saveData();
  res.json(data.surveys[index]);
});

app.post('/api/surveys/:id/publish', (req: Request, res: Response) => {
  const index = data.surveys.findIndex(s => s.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Survey not found' });
    return;
  }
  data.surveys[index].isPublished = true;
  data.surveys[index].publishedAt = Date.now();
  saveData();
  res.json(data.surveys[index]);
});

app.get('/api/surveys/:id/responses', (req: Request, res: Response) => {
  const survey = data.surveys.find(s => s.id === req.params.id);
  if (!survey) {
    res.status(404).json({ error: 'Survey not found' });
    return;
  }
  const responses = data.responses.filter(r => r.surveyId === req.params.id);
  res.json(responses);
});

app.post('/api/surveys/:id/responses', (req: Request, res: Response) => {
  const survey = data.surveys.find(s => s.id === req.params.id);
  if (!survey) {
    res.status(404).json({ error: 'Survey not found' });
    return;
  }
  const { answers, completionTime } = req.body;
  const response: SurveyResponse = {
    id: uuidv4(),
    surveyId: req.params.id,
    answers,
    submittedAt: Date.now(),
    completionTime,
  };
  data.responses.push(response);
  saveData();
  res.status(201).json(response);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
