import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  Assignment,
  Submission,
  Review,
  TestCase,
  AssignmentStats,
  SubmissionWithReviews,
} from '../types';
import { runCodeInSandbox } from './sandbox';

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(__dirname, '..', '..', 'src', 'data');

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

fs.ensureDirSync(DATA_DIR);
fs.ensureDirSync(path.join(DATA_DIR, 'assignments'));
fs.ensureDirSync(path.join(DATA_DIR, 'submissions'));
fs.ensureDirSync(path.join(DATA_DIR, 'reviews'));

interface CreateAssignmentBody {
  title: string;
  description: string;
  testCases: string;
}

interface SubmitCodeBody {
  code: string;
  studentId: string;
  studentName: string;
}

interface SubmitReviewBody {
  score: number;
  comment: string;
  reviewerId: string;
}

function parseTestCases(raw: string): TestCase[] {
  const lines = raw.split('\n').filter((l) => l.trim().length > 0);
  return lines.map((line) => {
    const parts = line.split('=>').map((p) => p.trim());
    return { input: parts[0] || '', expected: parts[1] || '' };
  });
}

function readAssignments(): Assignment[] {
  const dir = path.join(DATA_DIR, 'assignments');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  return files
    .map((f) => fs.readJsonSync(path.join(dir, f)) as Assignment)
    .sort((a, b) => b.createdAt - a.createdAt);
}

function writeAssignment(a: Assignment) {
  fs.writeJsonSync(path.join(DATA_DIR, 'assignments', `${a.id}.json`), a);
}

function readSubmissions(assignmentId?: string): Submission[] {
  const dir = path.join(DATA_DIR, 'submissions');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  let subs = files.map((f) => fs.readJsonSync(path.join(dir, f)) as Submission);
  if (assignmentId) {
    subs = subs.filter((s) => s.assignmentId === assignmentId);
  }
  return subs.sort((a, b) => b.submittedAt - a.submittedAt);
}

function writeSubmission(s: Submission) {
  fs.writeJsonSync(path.join(DATA_DIR, 'submissions', `${s.id}.json`), s);
}

function readReviews(assignmentId?: string, submissionId?: string): Review[] {
  const dir = path.join(DATA_DIR, 'reviews');
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  let reviews = files.map((f) => fs.readJsonSync(path.join(dir, f)) as Review);
  if (assignmentId) reviews = reviews.filter((r) => r.assignmentId === assignmentId);
  if (submissionId) reviews = reviews.filter((r) => r.submissionId === submissionId);
  return reviews.sort((a, b) => b.createdAt - a.createdAt);
}

function writeReview(r: Review) {
  fs.writeJsonSync(path.join(DATA_DIR, 'reviews', `${r.id}.json`), r);
}

app.get('/api/assignments', (_req, res) => {
  try {
    res.json(readAssignments());
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/assignments', (req, res) => {
  try {
    const { title, description, testCases } = req.body as CreateAssignmentBody;
    if (!title || title.length > 50) {
      return res.status(400).json({ error: '标题不能为空且不超过50字符' });
    }
    const parsed = parseTestCases(testCases || '');
    if (parsed.length === 0) {
      return res.status(400).json({ error: '至少需要一个测试用例' });
    }
    const assignment: Assignment = {
      id: uuidv4(),
      title,
      description,
      testCases: parsed,
      createdAt: Date.now(),
    };
    writeAssignment(assignment);
    res.status(201).json(assignment);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/assignments/:id/submissions', (req, res) => {
  try {
    const { id } = req.params;
    const { studentId } = req.query;
    let subs = readSubmissions(id);
    if (studentId) {
      subs = subs.filter((s) => s.studentId === (studentId as string));
    }
    res.json(subs);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/assignments/:id/submit', async (req, res) => {
  try {
    const { id } = req.params;
    const { code, studentId, studentName } = req.body as SubmitCodeBody;
    const assignments = readAssignments();
    const assignment = assignments.find((a) => a.id === id);
    if (!assignment) {
      return res.status(404).json({ error: '作业不存在' });
    }
    if (!code) {
      return res.status(400).json({ error: '代码不能为空' });
    }
    const testResults = await runCodeInSandbox(code, assignment.testCases);
    const passedCount = testResults.filter((t) => t.passed).length;
    const submission: Submission = {
      id: uuidv4(),
      assignmentId: id,
      studentId: studentId || 'anonymous',
      studentName: studentName || '匿名学生',
      code,
      submittedAt: Date.now(),
      testResults,
      passedCount,
      totalCount: testResults.length,
    };
    writeSubmission(submission);
    res.json(submission);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/assignments/:id/review/next', (req, res) => {
  try {
    const { id } = req.params;
    const { reviewerId } = req.query;
    const subs = readSubmissions(id);
    const otherSubs = subs.filter((s) => s.studentId !== reviewerId);
    if (otherSubs.length === 0) {
      return res.json(null);
    }
    const withReviews = otherSubs.map((s) => ({
      submission: s,
      reviews: readReviews(id, s.id),
    }));
    withReviews.sort((a, b) => a.reviews.length - b.reviews.length);
    const candidates = withReviews.filter((w) => !w.reviews.some((r) => r.reviewerId === reviewerId));
    if (candidates.length === 0) {
      return res.json(withReviews[0]?.submission || null);
    }
    const leastReviewed = candidates.filter((c) => c.reviews.length === candidates[0].reviews.length);
    const chosen = leastReviewed[Math.floor(Math.random() * leastReviewed.length)];
    res.json(chosen.submission);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/assignments/:id/submissions/:submissionId/review', (req, res) => {
  try {
    const { id, submissionId } = req.params;
    const { score, comment, reviewerId } = req.body as SubmitReviewBody;
    if (score < 1 || score > 5) {
      return res.status(400).json({ error: '评分必须在1-5之间' });
    }
    if (comment && comment.length > 200) {
      return res.status(400).json({ error: '评论不能超过200字符' });
    }
    const review: Review = {
      id: uuidv4(),
      assignmentId: id,
      submissionId,
      reviewerId: reviewerId || 'anonymous',
      score,
      comment: comment || '',
      createdAt: Date.now(),
    };
    writeReview(review);
    res.status(201).json(review);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/assignments/:id/reviews', (req, res) => {
  try {
    const { id } = req.params;
    res.json(readReviews(id));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/assignments/:id/stats', (req, res) => {
  try {
    const { id } = req.params;
    const subs = readSubmissions(id);
    const allReviews = readReviews(id);
    const hourly = new Array(24).fill(0);
    const subsWithReviews: SubmissionWithReviews[] = subs.map((s) => {
      const reviews = allReviews.filter((r) => r.submissionId === s.id);
      const avgScore = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length : 0;
      const hour = new Date(s.submittedAt).getHours();
      hourly[hour]++;
      return { ...s, reviews, averageReviewScore: avgScore };
    });
    const totalPassRate = subs.length > 0
      ? subs.reduce((sum, s) => sum + (s.totalCount > 0 ? s.passedCount / s.totalCount : 0), 0) / subs.length
      : 0;
    const scoredSubs = subsWithReviews.filter((s) => s.reviews.length > 0);
    const avgScore = scoredSubs.length > 0
      ? scoredSubs.reduce((sum, s) => sum + s.averageReviewScore, 0) / scoredSubs.length
      : 0;
    const stats: AssignmentStats = {
      assignmentId: id,
      totalSubmissions: subs.length,
      averagePassRate: totalPassRate,
      averageScore: avgScore,
      hourlyDistribution: hourly,
      submissions: subsWithReviews,
    };
    res.json(stats);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
