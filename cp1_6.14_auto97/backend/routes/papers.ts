import { Router, type Request, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db.js';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const db = await getDb();
    res.status(200).json(db.data.papers);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get papers' });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const paper = db.data.papers.find((p) => p.id === id);
    if (!paper) {
      res.status(404).json({ success: false, error: 'Paper not found' });
      return;
    }
    const questions = paper.questionIds
      .map((qid) => db.data.questions.find((q) => q.id === qid))
      .filter(Boolean);
    res.status(200).json({ ...paper, questions });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get paper' });
  }
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, chapterId, questionIds } = req.body;
    if (!title || !chapterId || !questionIds || !Array.isArray(questionIds)) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }
    const db = await getDb();
    const totalScore = questionIds.reduce((sum: number, qid: string) => {
      const q = db.data.questions.find((qq) => qq.id === qid);
      return sum + (q?.score ?? 0);
    }, 0);
    const newPaper = {
      id: uuidv4(),
      title,
      chapterId,
      questionIds,
      totalScore,
      createdAt: new Date().toISOString(),
    };
    db.data.papers.push(newPaper);
    await db.write();
    res.status(201).json(newPaper);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create paper' });
  }
});

router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, chapterId, questionIds } = req.body;
    const db = await getDb();
    const paper = db.data.papers.find((p) => p.id === id);
    if (!paper) {
      res.status(404).json({ success: false, error: 'Paper not found' });
      return;
    }
    if (title !== undefined) paper.title = title;
    if (chapterId !== undefined) paper.chapterId = chapterId;
    if (questionIds !== undefined && Array.isArray(questionIds)) {
      paper.questionIds = questionIds;
      paper.totalScore = questionIds.reduce((sum: number, qid: string) => {
        const q = db.data.questions.find((qq) => qq.id === qid);
        return sum + (q?.score ?? 0);
      }, 0);
    }
    await db.write();
    res.status(200).json(paper);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update paper' });
  }
});

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const index = db.data.papers.findIndex((p) => p.id === id);
    if (index === -1) {
      res.status(404).json({ success: false, error: 'Paper not found' });
      return;
    }
    db.data.papers.splice(index, 1);
    db.data.submissions = db.data.submissions.filter((s) => s.paperId !== id);
    db.data.gradingResults = db.data.gradingResults.filter((g) => {
      const submission = db.data.submissions.find((s) => s.id === g.submissionId);
      return submission !== undefined;
    });
    await db.write();
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete paper' });
  }
});

export default router;
