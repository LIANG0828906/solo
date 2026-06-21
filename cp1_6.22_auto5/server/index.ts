import express, { Request, Response } from 'express';
import cors from 'cors';

interface DragOption {
  id: string;
  content: string;
  type: 'text' | 'image';
}

interface DropZone {
  id: string;
  label: string;
}

interface Question {
  id: string;
  title: string;
  options: DragOption[];
  dropZones: DropZone[];
  correctMapping: Record<string, string>;
}

interface Exam {
  id: string;
  title: string;
  questions: Question[];
  createdAt: number;
}

interface StudentAnswer {
  questionId: string;
  placements: Record<string, string>;
}

interface SubmitRequest {
  answers: StudentAnswer[];
}

interface QuestionResult {
  questionId: string;
  score: number;
  total: number;
  correctPlacements: string[];
  wrongPlacements: string[];
  correctMapping: Record<string, string>;
}

interface SubmitResponse {
  totalScore: number;
  maxScore: number;
  results: QuestionResult[];
}

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const examStore = new Map<string, Exam>();

const generateId = (): string => {
  return Math.random().toString(36).substring(2, 10);
};

app.post('/exam', (req: Request, res: Response) => {
  const { title, questions } = req.body as { title: string; questions: Question[] };

  if (!title || !questions || questions.length < 3 || questions.length > 5) {
    return res.status(400).json({ error: '测验必须包含3-5道题目' });
  }

  for (const q of questions) {
    if (!q.title || !q.options || q.options.length === 0 || !q.dropZones || q.dropZones.length === 0) {
      return res.status(400).json({ error: '每道题必须包含标题、选项和目标区' });
    }
    if (!q.correctMapping || Object.keys(q.correctMapping).length !== q.options.length) {
      return res.status(400).json({ error: '必须为每个选项设置正确答案映射' });
    }
  }

  const examId = generateId();
  const exam: Exam = {
    id: examId,
    title,
    questions: questions.map((q) => ({
      ...q,
      id: q.id || generateId(),
      options: q.options.map((o) => ({ ...o, id: o.id || generateId() })),
      dropZones: q.dropZones.map((d) => ({ ...d, id: d.id || generateId() })),
    })),
    createdAt: Date.now(),
  };

  examStore.set(examId, exam);
  res.json({ id: examId });
});

app.get('/exam/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const exam = examStore.get(id);

  if (!exam) {
    return res.status(404).json({ error: '测验不存在' });
  }

  const examWithoutAnswers: Omit<Exam, 'questions'> & {
    questions: Omit<Question, 'correctMapping'>[];
  } = {
    ...exam,
    questions: exam.questions.map(({ correctMapping, ...rest }) => rest),
  };

  res.json(examWithoutAnswers);
});

app.post('/exam/:id/submit', (req: Request, res: Response) => {
  const startTime = Date.now();
  const { id } = req.params;
  const { answers } = req.body as SubmitRequest;

  const exam = examStore.get(id);
  if (!exam) {
    return res.status(404).json({ error: '测验不存在' });
  }

  if (!answers || answers.length !== exam.questions.length) {
    return res.status(400).json({ error: '答案不完整' });
  }

  let totalScore = 0;
  let maxScore = 0;
  const results: QuestionResult[] = [];

  for (const question of exam.questions) {
    const answer = answers.find((a) => a.questionId === question.id);
    if (!answer) {
      results.push({
        questionId: question.id,
        score: 0,
        total: question.options.length,
        correctPlacements: [],
        wrongPlacements: question.options.map((o) => o.id),
        correctMapping: question.correctMapping,
      });
      maxScore += question.options.length;
      continue;
    }

    const correctPlacements: string[] = [];
    const wrongPlacements: string[] = [];

    for (const option of question.options) {
      const placedZone = answer.placements[option.id];
      const correctZone = question.correctMapping[option.id];

      if (placedZone && placedZone === correctZone) {
        correctPlacements.push(option.id);
      } else {
        wrongPlacements.push(option.id);
      }
    }

    const score = correctPlacements.length;
    totalScore += score;
    maxScore += question.options.length;

    results.push({
      questionId: question.id,
      score,
      total: question.options.length,
      correctPlacements,
      wrongPlacements,
      correctMapping: question.correctMapping,
    });
  }

  const response: SubmitResponse = {
    totalScore,
    maxScore,
    results,
  };

  const elapsed = Date.now() - startTime;
  if (elapsed > 1000) {
    console.warn(`评分耗时超过1秒: ${elapsed}ms`);
  }

  res.json(response);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
