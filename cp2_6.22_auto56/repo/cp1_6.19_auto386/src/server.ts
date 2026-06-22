import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

interface Course {
  id: string;
  name: string;
  description: string;
}

interface FeedbackRecord {
  id: string;
  courseId: string;
  employeeName: string;
  avatarGradient: string;
  contentQuality: number;
  instructorExpression: number;
  practicalValue: number;
  comment: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  date: string;
}

const courses: Course[] = [
  { id: 'c1', name: 'React 高级开发实战', description: '深入学习React Hooks、状态管理与性能优化技巧' },
  { id: 'c2', name: 'TypeScript 全栈开发', description: '从零搭建TS全栈项目，掌握类型系统与工程化实践' },
  { id: 'c3', name: '领导力与团队管理', description: '提升管理效能，学习高效沟通与团队激励方法' },
  { id: 'c4', name: '数据分析入门', description: '掌握Excel与SQL基础，学会用数据驱动业务决策' },
  { id: 'c5', name: '项目管理实战', description: '敏捷开发与项目规划，实战演练项目全流程管理' },
  { id: 'c6', name: '职场沟通技巧', description: '提升职场沟通能力，学会高效表达与倾听反馈' },
];

const FIRST_NAMES = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '何', '林', '罗', '高'];
const LAST_NAMES = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '洋', '艳', '勇', '军', '杰', '娟', '涛', '明', '超', '秀英', '霞', '平'];

const GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
  'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
  'linear-gradient(135deg, #f5576c 0%, #ff6f91 100%)',
  'linear-gradient(135deg, #667eea 0%, #89f7fe 100%)',
];

const COMMENTS_POSITIVE = [
  '课程内容非常实用，讲师讲解清晰，收获很大',
  '很好的课程，案例分析到位，理论与实战结合紧密',
  '内容丰富，节奏合理，对工作很有帮助',
  '非常满意！讲师专业且有耐心，推荐给大家',
  '干货满满，学到了很多实用技巧，受益匪浅',
  '课程质量很高，深入浅出，容易理解',
  '非常喜欢这门课，内容新颖，引人深思',
  '专业且生动，课堂互动性强，学习体验极佳',
];

const COMMENTS_NEUTRAL = [
  '内容还可以，但部分章节略显浅显',
  '整体一般，有些地方讲解不够深入',
  '课程基本满足需求，希望能增加更多实战案例',
  '中规中矩，部分内容与预期有差距',
  '还行吧，有些章节有点拖沓',
];

const COMMENTS_NEGATIVE = [
  '课程内容太浅显，与描述不符，比较失望',
  '讲师表达混乱，PPT质量差，浪费时间',
  '内容枯燥无聊，完全没有实用性',
  '非常差劲，敷衍了事，不推荐',
  '课程过时，案例陈旧，毫无帮助',
];

const feedbacks: FeedbackRecord[] = [];

function randomName(): string {
  return FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)] +
    LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
}

function randomGradient(): string {
  return GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];
}

function randomDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo));
  return d.toISOString().split('T')[0];
}

function randomScore(): number {
  return Math.floor(Math.random() * 5) + 1;
}

function generateMockData() {
  for (const course of courses) {
    const count = 30 + Math.floor(Math.random() * 40);
    for (let i = 0; i < count; i++) {
      const sentimentRoll = Math.random();
      let comment: string;
      let sentiment: 'positive' | 'neutral' | 'negative';

      if (sentimentRoll < 0.55) {
        comment = COMMENTS_POSITIVE[Math.floor(Math.random() * COMMENTS_POSITIVE.length)];
        sentiment = 'positive';
      } else if (sentimentRoll < 0.8) {
        comment = COMMENTS_NEUTRAL[Math.floor(Math.random() * COMMENTS_NEUTRAL.length)];
        sentiment = 'neutral';
      } else {
        comment = COMMENTS_NEGATIVE[Math.floor(Math.random() * COMMENTS_NEGATIVE.length)];
        sentiment = 'negative';
      }

      let cq: number, ie: number, pv: number;
      if (sentiment === 'positive') {
        cq = Math.min(5, Math.max(1, Math.floor(Math.random() * 2) + 4));
        ie = Math.min(5, Math.max(1, Math.floor(Math.random() * 2) + 4));
        pv = Math.min(5, Math.max(1, Math.floor(Math.random() * 2) + 4));
      } else if (sentiment === 'negative') {
        cq = Math.min(5, Math.max(1, Math.floor(Math.random() * 2) + 1));
        ie = Math.min(5, Math.max(1, Math.floor(Math.random() * 2) + 1));
        pv = Math.min(5, Math.max(1, Math.floor(Math.random() * 2) + 1));
      } else {
        cq = Math.min(5, Math.max(1, Math.floor(Math.random() * 2) + 3));
        ie = Math.min(5, Math.max(1, Math.floor(Math.random() * 2) + 3));
        pv = Math.min(5, Math.max(1, Math.floor(Math.random() * 2) + 3));
      }

      feedbacks.push({
        id: `f_${course.id}_${i}`,
        courseId: course.id,
        employeeName: randomName(),
        avatarGradient: randomGradient(),
        contentQuality: cq,
        instructorExpression: ie,
        practicalValue: pv,
        comment,
        sentiment,
        date: randomDate(30),
      });
    }
  }
}

generateMockData();

app.get('/api/courses', (_req, res) => {
  const courseStats = courses.map((c) => {
    const cFeedbacks = feedbacks.filter((f) => f.courseId === c.id);
    const totalFeedback = cFeedbacks.length;
    const avgScore =
      totalFeedback > 0
        ? (
            cFeedbacks.reduce(
              (sum, f) => sum + (f.contentQuality + f.instructorExpression + f.practicalValue) / 3,
              0,
            ) / totalFeedback
          ).toFixed(1)
        : '0.0';
    return { ...c, totalFeedback, avgScore };
  });
  res.json(courseStats);
});

app.post('/api/feedback', (req, res) => {
  const { courseId, employeeName, contentQuality, instructorExpression, practicalValue, comment, sentiment } = req.body;
  const newFeedback: FeedbackRecord = {
    id: `f_${Date.now()}`,
    courseId,
    employeeName: employeeName || randomName(),
    avatarGradient: randomGradient(),
    contentQuality,
    instructorExpression,
    practicalValue,
    comment,
    sentiment: sentiment || 'neutral',
    date: new Date().toISOString().split('T')[0],
  };
  feedbacks.push(newFeedback);
  res.status(201).json(newFeedback);
});

app.get('/api/feedback', (req, res) => {
  const { courseId } = req.query;
  let result = feedbacks;
  if (courseId) {
    result = result.filter((f) => f.courseId === courseId);
  }
  res.json(result);
});

app.get('/api/analysis', (req, res) => {
  const { courseId, startDate, endDate } = req.query;
  let filtered = feedbacks.filter((f) => f.courseId === courseId);

  if (startDate) {
    filtered = filtered.filter((f) => f.date >= (startDate as string));
  }
  if (endDate) {
    filtered = filtered.filter((f) => f.date <= (endDate as string));
  }

  const dailyMap = new Map<string, { totalScore: number; count: number }>();
  for (const f of filtered) {
    const avg = (f.contentQuality + f.instructorExpression + f.practicalValue) / 3;
    const existing = dailyMap.get(f.date) || { totalScore: 0, count: 0 };
    existing.totalScore += avg;
    existing.count += 1;
    dailyMap.set(f.date, existing);
  }

  const dailyAverages = Array.from(dailyMap.entries())
    .map(([date, { totalScore, count }]) => ({
      date,
      avgScore: Number((totalScore / count).toFixed(2)),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const sentimentBreakdown = {
    positive: filtered.filter((f) => f.sentiment === 'positive').length,
    neutral: filtered.filter((f) => f.sentiment === 'neutral').length,
    negative: filtered.filter((f) => f.sentiment === 'negative').length,
  };

  const overallAvg =
    filtered.length > 0
      ? Number(
          (
            filtered.reduce(
              (sum, f) => sum + (f.contentQuality + f.instructorExpression + f.practicalValue) / 3,
              0,
            ) / filtered.length
          ).toFixed(2),
        )
      : 0;

  const dailyFeedbackCounts = Array.from(dailyMap.entries())
    .map(([date, { count }]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  res.json({
    dailyAverages,
    sentimentBreakdown,
    totalFeedback: filtered.length,
    overallAvg,
    dailyFeedbackCounts,
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
