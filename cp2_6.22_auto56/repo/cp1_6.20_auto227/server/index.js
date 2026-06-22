import express from 'express';
import cors from 'cors';
import { searchCourses, addReview, getCourseReputation, getUserReview } from './data.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/courses/search', (req, res) => {
  const keyword = req.query.keyword || '';

  setTimeout(() => {
    const courses = searchCourses(keyword.toString());
    const coursesWithUserReview = courses.map(course => ({
      ...course,
      userReview: getUserReview(course.id),
    }));
    res.json({ courses: coursesWithUserReview });
  }, 100 + Math.random() * 200);
});

app.post('/api/courses/:id/review', (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 10) {
    return res.status(400).json({ error: '评分必须在1-10之间' });
  }

  if (!comment || comment.trim().length === 0) {
    return res.status(400).json({ error: '评论不能为空' });
  }

  if (comment.length > 100) {
    return res.status(400).json({ error: '评论不能超过100字' });
  }

  setTimeout(() => {
    const review = addReview(id, rating, comment.trim());
    if (!review) {
      return res.status(404).json({ error: '课程不存在' });
    }
    res.json({ success: true, review });
  }, 100 + Math.random() * 200);
});

app.get('/api/courses/:id/reputation', (req, res) => {
  const { id } = req.params;

  setTimeout(() => {
    const reputation = getCourseReputation(id);
    if (!reputation) {
      return res.status(404).json({ error: '课程不存在' });
    }
    res.json(reputation);
  }, 50 + Math.random() * 150);
});

app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`  在线课程对比平台 - 后端服务`);
  console.log(`  🚀 服务运行在: http://localhost:${PORT}`);
  console.log(`  📚 API 接口:`);
  console.log(`     GET  /api/courses/search`);
  console.log(`     POST /api/courses/:id/review`);
  console.log(`     GET  /api/courses/:id/reputation`);
  console.log(`========================================\n`);
});
