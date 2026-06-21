import express from 'express';
import cors from 'cors';
import {
  createClassroom,
  joinClassroom,
  publishQuiz,
  submitAnswer,
  getClassroomState,
  endQuiz,
  getQuizReport,
} from './classroomService';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

app.post('/api/classrooms', (req, res) => {
  const { className, teacherName } = req.body;
  const classroom = createClassroom(className, teacherName);
  res.json(classroom);
});

app.get('/api/classrooms/:code', (req, res) => {
  const { code } = req.params;
  const state = getClassroomState(code);
  if (!state) {
    res.status(404).json({ error: '课堂不存在' });
    return;
  }
  res.json(state);
});

app.post('/api/classrooms/:code/join', (req, res) => {
  const { code } = req.params;
  const { studentName, studentId } = req.body;
  const result = joinClassroom(code, studentName, studentId);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json(result.student);
});

app.post('/api/classrooms/:code/quiz', (req, res) => {
  const { code } = req.params;
  const { questions } = req.body;
  const result = publishQuiz(code, questions);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json(result.quiz);
});

app.post('/api/classrooms/:code/answer', (req, res) => {
  const { code } = req.params;
  const { studentId, questionIndex, answer, timeSpent } = req.body;
  const result = submitAnswer(code, studentId, questionIndex, answer, timeSpent);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ success: true });
});

app.post('/api/classrooms/:code/end-quiz', (req, res) => {
  const { code } = req.params;
  const result = endQuiz(code);
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json({ success: true });
});

app.get('/api/classrooms/:code/report', (req, res) => {
  const { code } = req.params;
  const report = getQuizReport(code);
  if (!report) {
    res.status(404).json({ error: '报告不存在' });
    return;
  }
  res.json(report);
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
