import { Router, type Request, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db.js';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { paperId } = req.query;
    const db = await getDb();
    let submissions = [...db.data.submissions];
    if (paperId) {
      submissions = submissions.filter((s) => s.paperId === paperId);
    }
    res.status(200).json({ success: true, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get submissions' });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const submission = db.data.submissions.find((s) => s.id === id);
    if (!submission) {
      res.status(404).json({ success: false, error: 'Submission not found' });
      return;
    }
    const paper = db.data.papers.find((p) => p.id === submission.paperId);
    if (!paper) {
      res.status(404).json({ success: false, error: 'Associated paper not found' });
      return;
    }
    const questions = paper.questionIds
      .map((qid) => db.data.questions.find((q) => q.id === qid))
      .filter(Boolean);
    res.status(200).json({ success: true, data: { ...submission, paper, questions } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get submission' });
  }
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { paperId, studentName, answers } = req.body;
    if (!paperId || !studentName || !answers || !Array.isArray(answers)) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }
    const db = await getDb();
    const paper = db.data.papers.find((p) => p.id === paperId);
    if (!paper) {
      res.status(404).json({ success: false, error: 'Paper not found' });
      return;
    }
    const validAnswers = answers.filter((a: any) =>
      paper.questionIds.includes(a.questionId) && Array.isArray(a.answer)
    );
    const newSubmission = {
      id: uuidv4(),
      paperId,
      studentName,
      answers: validAnswers,
      submittedAt: new Date().toISOString(),
    };
    db.data.submissions.push(newSubmission);
    await db.write();
    res.status(201).json({ success: true, data: newSubmission });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create submission' });
  }
});

export default router;
