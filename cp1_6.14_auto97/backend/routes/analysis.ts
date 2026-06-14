import { Router, type Request, type Response } from 'express';
import { getDb } from '../db.js';
import type { KnowledgePointStat } from '../../shared/types.js';

const router = Router();

router.get('/weak-points', async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentName } = req.query;
    if (!studentName) {
      res.status(400).json({ success: false, error: 'studentName is required' });
      return;
    }
    const db = await getDb();

    const studentSubmissions = db.data.submissions.filter((s) => s.studentName === studentName);
    if (studentSubmissions.length === 0) {
      res.status(200).json([]);
      return;
    }

    const statsMap = new Map<string, KnowledgePointStat>();

    for (const submission of studentSubmissions) {
      const gradingResult = db.data.gradingResults.find((g) => g.submissionId === submission.id);
      if (!gradingResult) continue;

      for (const qr of gradingResult.questionResults) {
        const question = db.data.questions.find((q) => q.id === qr.questionId);
        if (!question) continue;

        const kp = question.knowledgePoint;
        if (!statsMap.has(kp)) {
          statsMap.set(kp, { name: kp, errorCount: 0, totalCount: 0 });
        }
        const stat = statsMap.get(kp)!;
        stat.totalCount++;
        if (!qr.isCorrect) {
          stat.errorCount++;
        }
      }
    }

    const stats = Array.from(statsMap.values()).sort((a, b) => {
      const errorRateA = a.totalCount > 0 ? a.errorCount / a.totalCount : 0;
      const errorRateB = b.totalCount > 0 ? b.errorCount / b.totalCount : 0;
      return errorRateB - errorRateA;
    });

    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get weak points' });
  }
});

router.get('/recommend', async (req: Request, res: Response): Promise<void> => {
  try {
    const { studentName, knowledgePoint } = req.query;
    if (!studentName) {
      res.status(400).json({ success: false, error: 'studentName is required' });
      return;
    }
    const db = await getDb();

    let targetKnowledgePoint: string | null = null;

    if (knowledgePoint) {
      targetKnowledgePoint = String(knowledgePoint);
    } else {
      const studentSubmissions = db.data.submissions.filter((s) => s.studentName === studentName);
      const statsMap = new Map<string, KnowledgePointStat>();

      for (const submission of studentSubmissions) {
        const gradingResult = db.data.gradingResults.find((g) => g.submissionId === submission.id);
        if (!gradingResult) continue;

        for (const qr of gradingResult.questionResults) {
          const question = db.data.questions.find((q) => q.id === qr.questionId);
          if (!question) continue;

          const kp = question.knowledgePoint;
          if (!statsMap.has(kp)) {
            statsMap.set(kp, { name: kp, errorCount: 0, totalCount: 0 });
          }
          const stat = statsMap.get(kp)!;
          stat.totalCount++;
          if (!qr.isCorrect) {
            stat.errorCount++;
          }
        }
      }

      const weakest = Array.from(statsMap.values()).sort((a, b) => {
        const errorRateA = a.totalCount > 0 ? a.errorCount / a.totalCount : 0;
        const errorRateB = b.totalCount > 0 ? b.errorCount / b.totalCount : 0;
        return errorRateB - errorRateA;
      })[0];

      if (weakest) {
        targetKnowledgePoint = weakest.name;
      }
    }

    let recommendedQuestions = db.data.questions;

    if (targetKnowledgePoint) {
      recommendedQuestions = recommendedQuestions.filter(
        (q) => q.knowledgePoint === targetKnowledgePoint
      );
    }

    const studentSubmissions = db.data.submissions.filter((s) => s.studentName === studentName);
    const answeredQuestionIds = new Set<string>();
    for (const submission of studentSubmissions) {
      for (const answer of submission.answers) {
        answeredQuestionIds.add(answer.questionId);
      }
    }

    const unanswered = recommendedQuestions.filter((q) => !answeredQuestionIds.has(q.id));
    const answered = recommendedQuestions.filter((q) => answeredQuestionIds.has(q.id));

    const finalRecommendations = [...unanswered, ...answered].slice(0, 10);

    res.status(200).json(finalRecommendations);
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get recommendations' });
  }
});

export default router;
