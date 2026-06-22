import express from 'express';
import cors from 'cors';
import type { Course, UserProgress, DailyActivity, RecommendedCourse } from '../shared/types';
import { storage } from './storage';
import { recommender } from './algorithm/recommender';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/courses', (_req, res) => {
  const courses: Course[] = storage.getAllCourses();
  res.json(courses);
});

app.get('/api/courses/:id', (req, res) => {
  const course = storage.getCourseById(req.params.id);
  if (!course) {
    res.status(404).json({ error: 'Course not found' });
    return;
  }
  res.json(course);
});

app.get('/api/progress', (_req, res) => {
  const progress: UserProgress[] = storage.getUserProgress();
  res.json(progress);
});

app.get('/api/progress/:courseId', (req, res) => {
  const progress = storage.getProgressByCourseId(req.params.courseId);
  if (!progress) {
    const course = storage.getCourseById(req.params.courseId);
    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }
    res.json({
      courseId: req.params.courseId,
      status: 'not_started',
      testScore: 0,
      minutesSpent: 0,
      lastUpdated: new Date().toISOString()
    });
    return;
  }
  res.json(progress);
});

app.post('/api/progress', (req, res) => {
  const progressData: UserProgress = req.body;
  if (!progressData.courseId) {
    res.status(400).json({ error: 'courseId is required' });
    return;
  }
  const updated = storage.updateProgress(progressData);
  res.json(updated);
});

app.get('/api/recommendations', (req, res) => {
  const limit = parseInt(req.query.limit as string) || 5;
  const recommendations: RecommendedCourse[] = recommender.generateRecommendations(limit);
  res.json(recommendations);
});

app.get('/api/activity', (req, res) => {
  const days = parseInt(req.query.days as string) || 7;
  const activity: DailyActivity[] = storage.getDailyActivity(days);
  res.json(activity);
});

app.post('/api/activity', (req, res) => {
  const { minutes } = req.body;
  if (typeof minutes !== 'number' || minutes < 0) {
    res.status(400).json({ error: 'Invalid minutes value' });
    return;
  }
  storage.addDailyMinutes(minutes);
  res.json({ success: true });
});

app.get('/api/stats', (_req, res) => {
  const progress = storage.getUserProgress();
  const activity = storage.getDailyActivity(7);

  const totalMinutes = progress.reduce((sum, p) => sum + p.minutesSpent, 0);
  const completedCount = progress.filter(p => p.status === 'completed').length;
  const completedScores = progress.filter(p => p.status === 'completed' && p.testScore > 0);
  const avgScore = completedScores.length > 0
    ? Math.round(completedScores.reduce((sum, p) => sum + p.testScore, 0) / completedScores.length)
    : 0;

  res.json({
    totalMinutes,
    completedCount,
    avgScore,
    activity
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
