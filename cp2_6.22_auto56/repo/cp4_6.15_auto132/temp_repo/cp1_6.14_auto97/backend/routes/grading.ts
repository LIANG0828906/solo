import { Router, type Request, type Response } from 'express';
import { getDb } from '../db.js';
import type { GradingResult, MatchMode } from '../../shared/types.js';

const router = Router();

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((val, idx) => val === sortedB[idx]);
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[，。、；：""''（）()\[\]【】]/g, '')
    .replace(/[,.;:]/g, '');
}

function fuzzyMatch(studentAnswer: string, correctAnswer: string): boolean {
  const normStudent = normalizeText(studentAnswer);
  const normCorrect = normalizeText(correctAnswer);
  if (normStudent === normCorrect) return true;
  if (normCorrect.includes(normStudent) && normStudent.length > 0) return true;
  if (normStudent.includes(normCorrect)) return true;
  return false;
}

function matchFillAnswer(studentAnswers: string[], fillAnswers: { answer: string; mode: MatchMode }[]): boolean {
  if (studentAnswers.length === 0) return false;
  const studentFlat = studentAnswers.map(normalizeText).join('');
  return fillAnswers.some(({ answer, mode }) => {
    if (mode === 'strict') {
      return studentAnswers.some((sa) => normalizeText(sa) === normalizeText(answer));
    } else {
      return fuzzyMatch(studentFlat, answer);
    }
  });
}

router.post('/auto-grade', async (req: Request, res: Response): Promise<void> => {
  try {
    const { submissionId } = req.body;
    if (!submissionId) {
      res.status(400).json({ success: false, error: 'submissionId is required' });
      return;
    }
    const db = await getDb();
    const submission = db.data.submissions.find((s) => s.id === submissionId);
    if (!submission) {
      res.status(404).json({ success: false, error: 'Submission not found' });
      return;
    }
    const paper = db.data.papers.find((p) => p.id === submission.paperId);
    if (!paper) {
      res.status(404).json({ success: false, error: 'Associated paper not found' });
      return;
    }

    const questionResults: GradingResult['questionResults'] = [];
    let totalScore = 0;

    for (const questionId of paper.questionIds) {
      const question = db.data.questions.find((q) => q.id === questionId);
      if (!question) continue;

      const studentAnswerObj = submission.answers.find((a) => a.questionId === questionId);
      const studentAnswer = studentAnswerObj?.answer ?? [];

      let isCorrect = false;
      let score = 0;
      const autoGraded = question.type !== 'fill';

      if (question.type === 'single' || question.type === 'multiple') {
        isCorrect = arraysEqual(studentAnswer, question.correctAnswer ?? []);
        score = isCorrect ? question.score : 0;
      } else if (question.type === 'fill') {
        if (question.fillAnswers) {
          isCorrect = matchFillAnswer(studentAnswer, question.fillAnswers);
          score = isCorrect ? question.score : 0;
        } else {
          score = 0;
        }
      }

      totalScore += score;

      questionResults.push({
        questionId,
        isCorrect,
        score,
        maxScore: question.score,
        studentAnswer,
        correctAnswer: question.type === 'fill'
          ? question.fillAnswers?.map((f) => f.answer) ?? []
          : question.correctAnswer ?? [],
        autoGraded,
      });
    }

    const gradingResult: GradingResult = {
      submissionId,
      questionResults,
      totalScore,
      gradedAt: new Date().toISOString(),
    };

    const existingIndex = db.data.gradingResults.findIndex((g) => g.submissionId === submissionId);
    if (existingIndex !== -1) {
      db.data.gradingResults[existingIndex] = gradingResult;
    } else {
      db.data.gradingResults.push(gradingResult);
    }
    await db.write();

    res.status(200).json({ success: true, data: gradingResult });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to auto grade' });
  }
});

router.post('/manual-grade', async (req: Request, res: Response): Promise<void> => {
  try {
    const { submissionId, questionId, score, comment } = req.body;
    if (!submissionId || !questionId || score === undefined) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }
    const db = await getDb();
    let gradingResult = db.data.gradingResults.find((g) => g.submissionId === submissionId);
    if (!gradingResult) {
      res.status(404).json({ success: false, error: 'Grading result not found, please run auto-grade first' });
      return;
    }
    const question = db.data.questions.find((q) => q.id === questionId);
    if (!question) {
      res.status(404).json({ success: false, error: 'Question not found' });
      return;
    }
    const questionResult = gradingResult.questionResults.find((qr) => qr.questionId === questionId);
    if (!questionResult) {
      res.status(404).json({ success: false, error: 'Question result not found in grading' });
      return;
    }

    const clampedScore = Math.max(0, Math.min(question.score, Number(score)));
    questionResult.score = clampedScore;
    questionResult.isCorrect = clampedScore >= question.score;
    questionResult.autoGraded = false;
    if (comment !== undefined) {
      questionResult.teacherComment = comment;
    }

    gradingResult.totalScore = gradingResult.questionResults.reduce((sum, qr) => sum + qr.score, 0);
    gradingResult.gradedAt = new Date().toISOString();

    await db.write();
    res.status(200).json({ success: true, data: gradingResult });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to manual grade' });
  }
});

router.get('/:submissionId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { submissionId } = req.params;
    const db = await getDb();
    const gradingResult = db.data.gradingResults.find((g) => g.submissionId === submissionId);
    if (!gradingResult) {
      res.status(404).json({ success: false, error: 'Grading result not found' });
      return;
    }
    res.status(200).json({ success: true, data: gradingResult });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get grading result' });
  }
});

export default router;
