import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let courses = [];
let progress = [];

function initSampleData() {
  const course1Id = uuidv4();
  const chapter1Id = uuidv4();
  const chapter2Id = uuidv4();
  const lesson1Id = uuidv4();
  const lesson2Id = uuidv4();
  const lesson3Id = uuidv4();
  const lesson4Id = uuidv4();

  courses.push({
    id: course1Id,
    title: '新员工入职培训',
    description: '帮助新员工快速了解公司文化、规章制度和工作流程',
    chapters: [
      {
        id: chapter1Id,
        title: '第一章 公司介绍',
        expanded: true,
        lessons: [
          {
            id: lesson1Id,
            title: '1.1 公司文化与价值观',
            content: {
              text: '<p><strong>公司使命</strong>：为客户创造卓越价值</p><ul><li>创新驱动</li><li>客户至上</li><li>团队协作</li></ul>',
              imageUrl: 'https://picsum.photos/seed/company/400/300',
              videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
            }
          },
          {
            id: lesson2Id,
            title: '1.2 组织架构介绍',
            content: {
              text: '<p>公司采用<strong>矩阵式管理架构</strong>，主要部门包括：</p><ul><li>产品研发部</li><li>市场营销部</li><li>人力资源部</li><li>财务部</li></ul>'
            }
          }
        ]
      },
      {
        id: chapter2Id,
        title: '第二章 规章制度',
        expanded: false,
        lessons: [
          {
            id: lesson3Id,
            title: '2.1 考勤制度',
            content: {
              text: '<p><strong>工作时间</strong>：周一至周五 9:00 - 18:00</p><ul><li>打卡时间：上班前30分钟内</li><li>迟到处理：超过10分钟扣薪</li><li>请假流程：提前申请审批</li></ul>',
              imageUrl: 'https://picsum.photos/seed/attendance/400/300'
            }
          },
          {
            id: lesson4Id,
            title: '2.2 安全规范',
            content: {
              text: '<p>遵循<strong>安全第一</strong>原则：</p><ul><li>佩戴劳保用品</li><li>熟悉消防通道</li><li>定期参加安全培训</li></ul>'
            }
          }
        ]
      }
    ],
    createdAt: Date.now() - 7 * 24 * 3600 * 1000,
    updatedAt: Date.now() - 2 * 24 * 3600 * 1000
  });

  const course2Id = uuidv4();
  const c3ch1Id = uuidv4();
  const c3l1Id = uuidv4();
  const c3l2Id = uuidv4();
  const c3l3Id = uuidv4();

  courses.push({
    id: course2Id,
    title: '产品销售技能提升',
    description: '提升销售团队的专业技巧和客户沟通能力',
    chapters: [
      {
        id: c3ch1Id,
        title: '销售核心技巧',
        expanded: true,
        lessons: [
          {
            id: c3l1Id,
            title: '客户需求分析',
            content: {
              text: '<p>通过<strong>SPIN提问法</strong>挖掘客户需求：</p><ul><li>情境型问题</li><li>问题型问题</li><li>暗示型问题</li><li>需求型问题</li></ul>',
              videoUrl: 'https://player.vimeo.com/video/76979871'
            }
          },
          {
            id: c3l2Id,
            title: '产品演示技巧',
            content: {
              text: '<p><strong>FAB法则</strong>进行产品介绍：</p><ul><li>Feature - 特性</li><li>Advantage - 优势</li><li>Benefit - 利益</li></ul>',
              imageUrl: 'https://picsum.photos/seed/sales/400/300'
            }
          },
          {
            id: c3l3Id,
            title: '异议处理',
            content: {
              text: '<p>处理客户异议的<strong>四步法</strong>：</p><ul><li>倾听认同</li><li>澄清问题</li><li>提出方案</li><li>确认共识</li></ul>'
            }
          }
        ]
      }
    ],
    createdAt: Date.now() - 14 * 24 * 3600 * 1000,
    updatedAt: Date.now() - 1 * 24 * 3600 * 1000
  });

  progress.push({
    courseId: course1Id,
    lessons: [
      { lessonId: lesson1Id, completed: true, timestamp: Date.now() - 5 * 24 * 3600 * 1000 },
      { lessonId: lesson2Id, completed: true, timestamp: Date.now() - 3 * 24 * 3600 * 1000 },
      { lessonId: lesson3Id, completed: false, timestamp: 0 },
      { lessonId: lesson4Id, completed: false, timestamp: 0 }
    ],
    lastStudyTime: Date.now() - 2 * 24 * 3600 * 1000,
    completed: false
  });

  progress.push({
    courseId: course2Id,
    lessons: [
      { lessonId: c3l1Id, completed: true, timestamp: Date.now() - 10 * 24 * 3600 * 1000 },
      { lessonId: c3l2Id, completed: false, timestamp: 0 },
      { lessonId: c3l3Id, completed: false, timestamp: 0 }
    ],
    lastStudyTime: Date.now() - 8 * 24 * 3600 * 1000,
    completed: false
  });
}

initSampleData();

app.get('/api/courses', (_req, res) => {
  setTimeout(() => res.json(courses), 100);
});

app.get('/api/courses/:id', (req, res) => {
  const course = courses.find(c => c.id === req.params.id);
  if (!course) return res.status(404).json({ error: 'Course not found' });
  res.json(course);
});

app.post('/api/courses', (req, res) => {
  const { title, description, chapters = [] } = req.body;
  const newCourse = {
    id: uuidv4(),
    title,
    description,
    chapters: chapters.map(ch => ({
      ...ch,
      id: ch.id || uuidv4(),
      lessons: (ch.lessons || []).map(l => ({
        ...l,
        id: l.id || uuidv4()
      }))
    })),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  courses.push(newCourse);

  progress.push({
    courseId: newCourse.id,
    lessons: newCourse.chapters.flatMap(ch =>
      ch.lessons.map(l => ({ lessonId: l.id, completed: false, timestamp: 0 }))
    ),
    lastStudyTime: 0,
    completed: false
  });

  res.status(201).json(newCourse);
});

app.put('/api/courses/:id', (req, res) => {
  const idx = courses.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Course not found' });
  courses[idx] = { ...courses[idx], ...req.body, id: req.params.id, updatedAt: Date.now() };
  res.json(courses[idx]);
});

app.delete('/api/courses/:id', (req, res) => {
  const len = courses.length;
  courses = courses.filter(c => c.id !== req.params.id);
  progress = progress.filter(p => p.courseId !== req.params.id);
  if (courses.length === len) return res.status(404).json({ error: 'Course not found' });
  res.json({ success: true });
});

app.get('/api/progress', (_req, res) => {
  res.json(progress);
});

app.get('/api/progress/:courseId', (req, res) => {
  const p = progress.find(x => x.courseId === req.params.courseId);
  if (!p) return res.status(404).json({ error: 'Progress not found' });
  res.json(p);
});

app.post('/api/progress/:courseId/lesson/:lessonId', (req, res) => {
  const p = progress.find(x => x.courseId === req.params.courseId);
  if (!p) return res.status(404).json({ error: 'Progress not found' });
  const lp = p.lessons.find(x => x.lessonId === req.params.lessonId);
  if (!lp) {
    p.lessons.push({ lessonId: req.params.lessonId, completed: true, timestamp: Date.now() });
  } else {
    lp.completed = true;
    lp.timestamp = Date.now();
  }
  p.lastStudyTime = Date.now();

  const course = courses.find(c => c.id === req.params.courseId);
  const totalLessons = course ? course.chapters.reduce((sum, ch) => sum + ch.lessons.length, 0) : 0;
  const completedCount = p.lessons.filter(l => l.completed).length;
  if (totalLessons > 0 && completedCount >= totalLessons) {
    p.completed = true;
  }

  res.json(p);
});

app.post('/api/progress/:courseId/complete', (req, res) => {
  const p = progress.find(x => x.courseId === req.params.courseId);
  if (!p) return res.status(404).json({ error: 'Progress not found' });
  p.completed = true;
  p.lastStudyTime = Date.now();
  p.lessons.forEach(l => {
    if (!l.completed) {
      l.completed = true;
      l.timestamp = Date.now();
    }
  });
  res.json(p);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
