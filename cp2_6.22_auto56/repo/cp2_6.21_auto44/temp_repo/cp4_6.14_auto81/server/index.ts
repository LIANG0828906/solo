import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json());

interface Course {
  id: string;
  name: string;
  description: string;
  instructor: string;
  averageRating: number;
  totalStudents: number;
  participationRate: number;
}

interface Feedback {
  id: string;
  courseId: string;
  rating: number;
  comment: string;
  timestamp: string;
  studentName: string;
}

interface ParticipationData {
  date: string;
  count: number;
}

const courses: Course[] = [
  {
    id: 'course-1',
    name: '高等数学 A',
    description: '涵盖微积分、级数、多元函数等核心内容，注重数学思维和解题能力培养',
    instructor: '张明教授',
    averageRating: 4.3,
    totalStudents: 156,
    participationRate: 0.87,
  },
  {
    id: 'course-2',
    name: '数据结构与算法',
    description: '系统学习常用数据结构和算法设计方法，培养计算思维和编程能力',
    instructor: '李华副教授',
    averageRating: 4.7,
    totalStudents: 203,
    participationRate: 0.92,
  },
  {
    id: 'course-3',
    name: '操作系统原理',
    description: '深入理解进程管理、内存管理、文件系统等操作系统核心概念',
    instructor: '王强教授',
    averageRating: 3.9,
    totalStudents: 128,
    participationRate: 0.76,
  },
  {
    id: 'course-4',
    name: '人工智能导论',
    description: '介绍机器学习、深度学习、自然语言处理等AI基础领域知识和应用',
    instructor: '陈雪教授',
    averageRating: 4.8,
    totalStudents: 245,
    participationRate: 0.95,
  },
  {
    id: 'course-5',
    name: '软件工程实践',
    description: '学习软件开发生命周期、敏捷开发方法、项目管理及团队协作实践',
    instructor: '刘洋副教授',
    averageRating: 4.1,
    totalStudents: 112,
    participationRate: 0.82,
  },
  {
    id: 'course-6',
    name: '计算机网络',
    description: '掌握TCP/IP协议族、网络架构、安全机制和现代网络技术',
    instructor: '赵磊教授',
    averageRating: 4.5,
    totalStudents: 178,
    participationRate: 0.89,
  },
];

const studentNames = [
  '王小红', '李明', '张三', '刘芳', '陈伟', '杨洋', '黄丽', '周杰',
  '吴敏', '郑浩', '王磊', '孙丽丽', '朱文', '马超', '胡勇', '林静',
  '何平', '高远', '梁欣', '谢宇', '韩梅', '唐强', '冯雪', '董涛',
  '萧然', '程程', '曹军', '袁媛', '邓鹏', '许晴',
];

const commentTemplates = [
  '老师讲解非常清晰，每个知识点都有很好的例子来说明，课后练习也很有针对性。希望能多一些实际案例分析的环节，这样能更好地将理论与实践结合。',
  '课程内容非常丰富，从基础概念到高级应用都有涵盖。特别是项目实践部分，让我对知识的应用有了更深的理解。建议增加更多的互动讨论环节。',
  '整体课程节奏把握得很好，难度循序渐进。课堂上的小组讨论环节很有意思，同学们的分享也让我学到了很多不同视角的知识。',
  '这节课的实验部分设计得非常巧妙，让我们动手实践的同时加深了对理论的理解。不过有些实验步骤的说明可以更详细一些，刚开始有点摸不着头脑。',
  '非常喜欢老师的教学风格，幽默风趣又不失专业性。课后的思考题很有深度，促使我进一步查阅资料。建议提供一些拓展阅读材料。',
  '课程内容覆盖面很广，但是有些章节感觉过于赶了，可以适当增加课时。课堂笔记的整理方式也很好，方便复习。希望能提供录播回放。',
  '这学期的课程安排很合理，理论与实践的比例适当。特别是期中的项目展示，让我们有机会展示自己的学习成果。评分标准也很清晰公正。',
  '老师对每个学生的问题都耐心解答，非常负责。课程网站上的补充材料也很实用，包括视频教程和在线练习。建议增加更多的小测验来检验学习效果。',
  '这门课让我对专业有了更深的理解和热情。课堂上的实时编程演示非常直观，错误排查的过程也很有教育意义。希望能多一些这样的现场演示。',
  '课程的设计非常系统化，每一节课都环环相扣。小组作业促进了同学间的交流合作，虽然有时协调比较困难，但收获很大。建议给小组作业更多时间。',
  '教学内容紧跟行业前沿，很多最新的技术和案例都涉及到了。课堂上的讨论环节激发了很多有趣的思考。建议邀请一些业界专家来做客座分享。',
  '实验环境的搭建说明非常详细，基本上照着步骤就能完成。课程的考核方式多元化，不只是一次期末考试，这点很好。希望可以提供更多的学习资源。',
];

const feedbackList: Feedback[] = [];

function generateFeedbackForCourse(courseId: string, count: number) {
  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const hoursAgo = Math.floor(Math.random() * 24);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(date.getHours() - hoursAgo);

    feedbackList.push({
      id: uuidv4(),
      courseId,
      rating: Math.floor(Math.random() * 3) + 3,
      comment: commentTemplates[Math.floor(Math.random() * commentTemplates.length)],
      timestamp: date.toISOString(),
      studentName: studentNames[Math.floor(Math.random() * studentNames.length)],
    });
  }
}

courses.forEach(course => {
  generateFeedbackForCourse(course.id, 25 + Math.floor(Math.random() * 20));
});

feedbackList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

function generateParticipationData(courseId: string): ParticipationData[] {
  const data: ParticipationData[] = [];
  const baseCount = courses.find(c => c.id === courseId)?.totalStudents || 100;
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
    const variance = Math.floor(Math.random() * 30) - 15;
    const count = Math.max(10, Math.floor(baseCount * 0.6) + variance);
    data.push({ date: dateStr, count });
  }
  return data;
}

app.get('/api/courses', (_req, res) => {
  res.json(courses);
});

app.get('/api/feedback', (req, res) => {
  const { courseId, page = '1', limit = '20' } = req.query;
  let filtered = feedbackList;
  if (courseId) {
    filtered = filtered.filter(f => f.courseId === courseId);
  }
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 20);
  const start = (pageNum - 1) * limitNum;
  const data = filtered.slice(start, start + limitNum);
  res.json({ data, total: filtered.length });
});

app.post('/api/feedback', (req, res) => {
  const { courseId, rating, comment } = req.body;
  if (!courseId || !rating) {
    res.status(400).json({ error: 'courseId and rating are required' });
    return;
  }
  const newFeedback: Feedback = {
    id: uuidv4(),
    courseId,
    rating,
    comment: comment || '',
    timestamp: new Date().toISOString(),
    studentName: '讲师反馈',
  };
  feedbackList.unshift(newFeedback);

  const courseFeedback = feedbackList.filter(f => f.courseId === courseId);
  const course = courses.find(c => c.id === courseId);
  if (course) {
    course.averageRating = courseFeedback.reduce((sum, f) => sum + f.rating, 0) / courseFeedback.length;
  }

  res.json(newFeedback);
});

app.get('/api/participation/:courseId', (req, res) => {
  const { courseId } = req.params;
  res.json(generateParticipationData(courseId));
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
