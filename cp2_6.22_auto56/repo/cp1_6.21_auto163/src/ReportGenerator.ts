import { Router, Request, Response } from 'express';
import type { Student, WeeklyReport, QuizScore, Chapter, ReviewItem } from './types';

const router = Router();

const mockStudents: Student[] = [
  { id: 'S001', name: '张三' },
  { id: 'S002', name: '李四' },
  { id: 'S003', name: '王五' },
  { id: 'S004', name: '赵六' },
];

const generateMockQuizScores = (studentId: string, endDate: Date): QuizScore[] => {
  const scores: QuizScore[] = [];
  const baseScore = studentId.charCodeAt(3) % 30 + 55;
  for (let i = 4; i >= 0; i--) {
    const date = new Date(endDate);
    date.setDate(date.getDate() - i * 2);
    const variance = Math.floor(Math.random() * 30) - 10;
    scores.push({
      score: Math.min(100, Math.max(40, baseScore + variance)),
      date: date.toISOString().split('T')[0],
    });
  }
  return scores;
};

const generateMockChapters = (studentId: string): Chapter[] => {
  const allChapters: Chapter[] = [
    { id: 'C1', name: 'JavaScript 基础语法', averageScore: 0 },
    { id: 'C2', name: 'React 组件开发', averageScore: 0 },
    { id: 'C3', name: 'TypeScript 类型系统', averageScore: 0 },
    { id: 'C4', name: 'Node.js 服务端编程', averageScore: 0 },
    { id: 'C5', name: '前端工程化实践', averageScore: 0 },
    { id: 'C6', name: '数据结构与算法', averageScore: 0 },
  ];
  const base = studentId.charCodeAt(3) % 3;
  const count = 2 + (studentId.charCodeAt(2) % 3);
  return allChapters.slice(base, base + count).map((ch) => ({
    ...ch,
    averageScore: Math.floor(Math.random() * 60) + 35,
  }));
};

const calculateScoreTrend = (scores: QuizScore[]): string => {
  if (scores.length < 2) return '数据不足';
  const first = scores[0].score;
  const last = scores[scores.length - 1].score;
  const diff = last - first;
  if (diff > 0) return `上升${diff}分`;
  if (diff < 0) return `下降${Math.abs(diff)}分`;
  return '持平';
};

const generateReviewItems = (chapters: Chapter[]): ReviewItem[] => {
  return chapters
    .filter((ch) => ch.averageScore < 60)
    .slice(0, 3)
    .map((ch) => ({
      chapterName: ch.name,
      averageScore: ch.averageScore,
    }));
};

const generateRecommendations = (chapters: Chapter[]): string[] => {
  const weak = chapters.filter((ch) => ch.averageScore < 60);
  const recs: string[] = [];
  if (weak.length > 0) {
    recs.push(`重点复习「${weak[0].name}」相关知识点`);
  }
  recs.push('完成每日编程练习，保持代码手感');
  recs.push('学习下一章节前先预习核心概念');
  return recs.slice(0, 3);
};

router.get('/students', (_req: Request, res: Response) => {
  res.json(mockStudents);
});

router.get('/report', (req: Request, res: Response) => {
  const { studentId, startDate, endDate } = req.query;

  if (!studentId || !startDate || !endDate) {
    res.status(400).json({ error: '缺少必要参数: studentId, startDate, endDate' });
    return;
  }

  const student = mockStudents.find((s) => s.id === studentId);
  if (!student) {
    res.status(404).json({ error: '未找到该学员' });
    return;
  }

  const end = new Date(endDate as string);
  const totalMinutes = Math.floor(Math.random() * 600) + 300;
  const quizScores = generateMockQuizScores(studentId as string, end);
  const completedChapters = generateMockChapters(studentId as string);
  const reviewItems = generateReviewItems(completedChapters);
  const recommendedContent = generateRecommendations(completedChapters);

  const report: WeeklyReport = {
    studentId: student.id,
    studentName: student.name,
    startDate: startDate as string,
    endDate: endDate as string,
    totalMinutes,
    completedChapters,
    quizScores,
    reviewItems,
    recommendedContent,
    scoreTrend: calculateScoreTrend(quizScores),
  };

  res.json(report);
});

export default router;
