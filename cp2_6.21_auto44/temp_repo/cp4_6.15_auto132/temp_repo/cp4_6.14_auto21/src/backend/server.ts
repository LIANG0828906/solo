import express from 'express';
import cors from 'cors';
import { dataStore } from './dataStore';
import type {
  CreateCourseRequest,
  UpdateChapterRequest,
  SubmitAssessmentRequest,
} from './types';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

app.use((_req, _res, next) => {
  setTimeout(next, 200);
});

app.get('/api/instructors', (_req, res) => {
  const instructors = dataStore.getInstructors();
  res.json(instructors);
});

app.get('/api/courses', (_req, res) => {
  const courses = dataStore.getCourses();
  res.json(courses);
});

app.get('/api/courses/schedule', (_req, res) => {
  const courses = dataStore.getCourses();
  const instructors = dataStore.getInstructors();
  const schedule = courses.map((course) => ({
    ...course,
    instructor: instructors.find((i) => i.id === course.instructorId),
  }));
  res.json(schedule);
});

app.post('/api/courses', (req, res) => {
  const request = req.body as CreateCourseRequest;
  const result = dataStore.createCourse(request);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.put('/api/courses/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body as Partial<CreateCourseRequest>;
  const result = dataStore.updateCourse(id, updates);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.delete('/api/courses/:id', (req, res) => {
  const { id } = req.params;
  const success = dataStore.deleteCourse(id);
  if (!success) {
    return res.status(404).json({ success: false, message: '课程不存在' });
  }
  res.json({ success: true });
});

app.get('/api/learners', (_req, res) => {
  const learners = dataStore.getLearners();
  res.json(learners);
});

app.get('/api/learners/:id', (req, res) => {
  const { id } = req.params;
  const learner = dataStore.getLearnerById(id);
  if (!learner) {
    return res.status(404).json({ message: '学员不存在' });
  }
  res.json(learner);
});

app.post('/api/learners/:learnerId/enroll/:courseId', (req, res) => {
  const { learnerId, courseId } = req.params;
  const result = dataStore.enrollCourse(learnerId, courseId);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

app.get('/api/learners/:learnerId/progress', (req, res) => {
  const { learnerId } = req.params;
  const progress = dataStore.getLearnerProgress(learnerId);
  res.json(progress);
});

app.put(
  '/api/learners/:learnerId/courses/:courseId/chapters/:chapterId',
  (req, res) => {
    const { learnerId, courseId, chapterId } = req.params;
    const { completed } = req.body as UpdateChapterRequest;
    const result = dataStore.updateChapterCompletion(
      learnerId,
      courseId,
      chapterId,
      completed
    );
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  }
);

app.post(
  '/api/learners/:learnerId/courses/:courseId/assessment',
  (req, res) => {
    const { learnerId, courseId } = req.params;
    const request = req.body as SubmitAssessmentRequest;
    const result = dataStore.submitAssessment(learnerId, courseId, request);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  }
);

app.get('/api/analytics/stats', (_req, res) => {
  const stats = dataStore.getAnalyticsStats();
  res.json(stats);
});

app.get('/api/analytics/time-slots', (_req, res) => {
  const stats = dataStore.getTimeSlotStats();
  res.json(stats);
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});


