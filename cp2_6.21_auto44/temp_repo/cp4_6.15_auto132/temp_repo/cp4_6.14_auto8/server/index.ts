import express from 'express';
import cors from 'cors';
import { store, genId } from './store.js';
import { executeCode } from './executor.js';
import type {
  SubmitRequest,
  CreateAssignmentRequest,
  Submission,
  TestResult,
} from '../src/types.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.post('/api/submit', async (req, res) => {
  try {
    const { assignmentId, studentId, studentName, language, code } =
      req.body as SubmitRequest;

    const assignment = store.assignments.find((a) => a.id === assignmentId);
    if (!assignment) {
      res.status(404).json({ error: '作业不存在' });
      return;
    }

    const results: TestResult[] = [];
    let passCount = 0;

    for (const tc of assignment.testCases) {
      try {
        const execResult = await executeCode(language, code, tc.input);
        const actual = execResult.stdout.trim();
        const passed = actual === tc.expected.trim();

        if (passed) passCount++;

        results.push({
          caseId: tc.id,
          passed,
          actual: tc.hidden ? (passed ? '✓' : '✗') : actual,
          expected: tc.hidden ? '***' : tc.expected,
          hidden: tc.hidden,
        });
      } catch {
        results.push({
          caseId: tc.id,
          passed: false,
          actual: '执行错误',
          expected: tc.hidden ? '***' : tc.expected,
          hidden: tc.hidden,
        });
      }
    }

    const score = Math.round((passCount / assignment.testCases.length) * 100);

    const submission: Submission = {
      id: genId('s'),
      assignmentId,
      studentId,
      studentName,
      language,
      code,
      score,
      results,
      comments: [],
      submittedAt: Date.now(),
    };

    store.submissions.push(submission);

    res.json({
      submissionId: submission.id,
      score,
      results,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || '服务器错误' });
  }
});

app.post('/api/assignment', (req, res) => {
  try {
    const { title, description, sampleInput, sampleOutput, testCases } =
      req.body as CreateAssignmentRequest;

    const assignment = {
      id: genId('a'),
      title,
      description,
      sampleInput,
      sampleOutput,
      testCases: testCases.map((tc, i) => ({
        id: `tc_${Date.now()}_${i}`,
        ...tc,
      })),
      createdAt: Date.now(),
    };

    store.assignments.push(assignment);
    res.json(assignment);
  } catch (err: any) {
    res.status(500).json({ error: err.message || '服务器错误' });
  }
});

app.get('/api/stats', (req, res) => {
  const assignmentId = req.query.assignmentId as string;
  let submissions = store.submissions;
  if (assignmentId) {
    submissions = submissions.filter((s) => s.assignmentId === assignmentId);
  }

  const ranges = [
    { range: '0-59', min: 0, max: 59 },
    { range: '60-69', min: 60, max: 69 },
    { range: '70-79', min: 70, max: 79 },
    { range: '80-89', min: 80, max: 89 },
    { range: '90-100', min: 90, max: 100 },
  ];

  const distribution = ranges.map((r) => ({
    range: r.range,
    count: submissions.filter((s) => s.score >= r.min && s.score <= r.max)
      .length,
  }));

  res.json({ distribution, submissions });
});

app.get('/api/assignments', (_req, res) => {
  res.json(store.assignments);
});

app.get('/api/submissions', (req, res) => {
  const assignmentId = req.query.assignmentId as string;
  let submissions = store.submissions;
  if (assignmentId) {
    submissions = submissions.filter((s) => s.assignmentId === assignmentId);
  }
  res.json(submissions);
});

app.get('/api/submission/:id', (req, res) => {
  const sub = store.submissions.find((s) => s.id === req.params.id);
  if (!sub) {
    res.status(404).json({ error: '提交不存在' });
    return;
  }
  res.json(sub);
});

app.post('/api/submission/:id/comment', (req, res) => {
  const sub = store.submissions.find((s) => s.id === req.params.id);
  if (!sub) {
    res.status(404).json({ error: '提交不存在' });
    return;
  }
  const { author, content } = req.body;
  const comment = {
    id: genId('c'),
    author: author || 'teacher',
    content,
    createdAt: Date.now(),
  };
  sub.comments.push(comment);
  res.json(comment);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
