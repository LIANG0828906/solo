import { Router, type Request, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db.js';
import type { Question, QuestionType, Difficulty } from '../../shared/types.js';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { chapterId, type, difficulty } = req.query;
    const db = await getDb();
    let questions = [...db.data.questions];
    if (chapterId) {
      questions = questions.filter((q) => q.chapterId === chapterId);
    }
    if (type) {
      questions = questions.filter((q) => q.type === (type as QuestionType));
    }
    if (difficulty) {
      questions = questions.filter((q) => q.difficulty === (difficulty as Difficulty));
    }
    res.status(200).json({ success: true, data: questions });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get questions' });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const question = db.data.questions.find((q) => q.id === id);
    if (!question) {
      res.status(404).json({ success: false, error: 'Question not found' });
      return;
    }
    res.status(200).json({ success: true, data: question });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get question' });
  }
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      chapterId,
      type,
      difficulty,
      content,
      knowledgePoint,
      score,
      options,
      correctAnswer,
      fillAnswers,
      explanation,
    } = req.body as Partial<Question>;

    if (!chapterId || !type || !difficulty || !content || !knowledgePoint || score === undefined || !explanation) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }

    if (type === 'single' || type === 'multiple') {
      if (!options || options.length === 0 || !correctAnswer || correctAnswer.length === 0) {
        res.status(400).json({ success: false, error: 'Choice questions require options and correctAnswer' });
        return;
      }
    }

    if (type === 'fill') {
      if (!fillAnswers || fillAnswers.length === 0) {
        res.status(400).json({ success: false, error: 'Fill questions require fillAnswers' });
        return;
      }
    }

    const db = await getDb();
    const newQuestion: Question = {
      id: uuidv4(),
      chapterId,
      type,
      difficulty,
      content,
      knowledgePoint,
      score,
      options,
      correctAnswer,
      fillAnswers,
      explanation,
      createdAt: new Date().toISOString(),
    };
    db.data.questions.push(newQuestion);
    await db.write();
    res.status(201).json({ success: true, data: newQuestion });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create question' });
  }
});

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const question = db.data.questions.find((q) => q.id === id);
    if (!question) {
      res.status(404).json({ success: false, error: 'Question not found' });
      return;
    }

    const updates = req.body as Partial<Question>;
    const allowedFields: (keyof Question)[] = [
      'chapterId',
      'type',
      'difficulty',
      'content',
      'knowledgePoint',
      'score',
      'options',
      'correctAnswer',
      'fillAnswers',
      'explanation',
    ];

    for (const field of allowedFields) {
      if (field in updates) {
        (question as any)[field] = (updates as any)[field];
      }
    }

    await db.write();
    res.status(200).json({ success: true, data: question });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update question' });
  }
});

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const index = db.data.questions.findIndex((q) => q.id === id);
    if (index === -1) {
      res.status(404).json({ success: false, error: 'Question not found' });
      return;
    }
    db.data.questions.splice(index, 1);
    for (const paper of db.data.papers) {
      paper.questionIds = paper.questionIds.filter((qid) => qid !== id);
      paper.totalScore = paper.questionIds.reduce((sum, qid) => {
        const q = db.data.questions.find((qq) => qq.id === qid);
        return sum + (q?.score ?? 0);
      }, 0);
    }
    await db.write();
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete question' });
  }
});

export default router;
