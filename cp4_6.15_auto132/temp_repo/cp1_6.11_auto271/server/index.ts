import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

type CourseCategory = '琴' | '棋' | '书' | '画';

interface Question {
  id: number;
  question: string;
  options: string[];
  answer: number;
}

interface Course {
  id: number;
  name: string;
  category: CourseCategory;
  teacher: string;
  startTime: string;
  description: string;
  maxStudents: number;
  enrolledCount: number;
  questions: Question[];
}

interface User {
  id: number;
  name: string;
  avatar: string;
  grade: string;
  role: 'student' | 'teacher';
  enrolledCourses: { courseId: number; completed: boolean; score: number }[];
  totalScore: number;
}

const courses: Course[] = [
  {
    id: 1,
    name: '古琴入门指法',
    category: '琴',
    teacher: '伯牙先生',
    startTime: '每月初一、十五 辰时',
    description: '本课程教授古琴基础指法，包括抹、挑、勾、剔等基本技法。学员将学习如何正确坐姿、按弦、运指，以及演奏简单的古曲片段。通过本课程的学习，学员能够掌握古琴的基本演奏技巧，体会古琴音乐的韵味与意境。',
    maxStudents: 20,
    enrolledCount: 15,
    questions: [
      { id: 1, question: '下列哪种指法是古琴的"抹"？', options: ['A. 食指勾弦', 'B. 中指挑弦', 'C. 拇指托弦', 'D. 食指踢弦'], answer: 0 },
      { id: 2, question: '古琴有几根弦？', options: ['A. 五根', 'B. 六根', 'C. 七根', 'D. 八根'], answer: 2 },
      { id: 3, question: '古琴"挑"是用哪个手指？', options: ['A. 食指', 'B. 中指', 'C. 无名指', 'D. 拇指'], answer: 0 },
      { id: 4, question: '下列哪首是古琴名曲？', options: ['A. 高山流水', 'B. 二泉映月', 'C. 百鸟朝凤', 'D. 十面埋伏'], answer: 0 }
    ]
  },
  {
    id: 2,
    name: '梅花三弄详解',
    category: '琴',
    teacher: '子期先生',
    startTime: '每周三 午时',
    description: '《梅花三弄》是中国古代著名的琴曲，以梅花的高洁品格为主题。本课程将深入解析此曲的结构、意境与演奏技巧，带领学员体会曲中梅花傲雪凌霜的精神。',
    maxStudents: 15,
    enrolledCount: 10,
    questions: [
      { id: 1, question: '《梅花三弄》的"三弄"是指什么？', options: ['A. 三段旋律', 'B. 三种演奏手法', 'C. 同一段旋律重复三次', 'D. 三种情感表达'], answer: 2 },
      { id: 2, question: '《梅花三弄》最初是用什么乐器演奏的？', options: ['A. 古琴', 'B. 笛子', 'C. 琵琶', 'D. 箫'], answer: 1 },
      { id: 3, question: '琴曲《梅花三弄》的主题是歌颂什么？', options: ['A. 春天', 'B. 梅花的高洁', 'C. 爱情', 'D. 友情'], answer: 1 }
    ]
  },
  {
    id: 3,
    name: '围棋入门基础',
    category: '棋',
    teacher: '奕秋先生',
    startTime: '每周一、四 申时',
    description: '本课程从围棋基础规则讲起，包括气、提子、死活、打劫等基本概念。学员将学习基本的布局思路和简单的定式，为进一步学习围棋打下坚实基础。',
    maxStudents: 30,
    enrolledCount: 25,
    questions: [
      { id: 1, question: '围棋棋盘有多少条纵横线？', options: ['A. 15条', 'B. 17条', 'C. 19条', 'D. 21条'], answer: 2 },
      { id: 2, question: '围棋中棋子的"气"是指什么？', options: ['A. 棋子的数量', 'B. 棋子周围空着的交叉点', 'C. 棋子的颜色', 'D. 棋子的大小'], answer: 1 },
      { id: 3, question: '黑白双方谁先走？', options: ['A. 黑方', 'B. 白方', 'C. 随机', 'D. 轮流'], answer: 0 },
      { id: 4, question: '围棋的"劫"是指什么？', options: ['A. 一种开局方式', 'B. 一种特殊的提子规则', 'C. 一种终局方式', 'D. 一种棋子名称'], answer: 1 },
      { id: 5, question: '围棋中的"目"是什么意思？', options: ['A. 眼睛', 'B. 围住的空点', 'C. 棋子的数量', 'D. 棋盘的格子'], answer: 1 }
    ]
  },
  {
    id: 4,
    name: '象棋战术精要',
    category: '棋',
    teacher: '桔中居士',
    startTime: '每周二、五 酉时',
    description: '本课程讲授中国象棋的基本战术，包括兑子、捉子、抽将、闪击等常用战术技巧。通过经典对局的解析，提高学员的实战能力和棋艺水平。',
    maxStudents: 25,
    enrolledCount: 20,
    questions: [
      { id: 1, question: '中国象棋中"马"走什么字？', options: ['A. 日', 'B. 田', 'C. 一', 'D. L'], answer: 0 },
      { id: 2, question: '"象"不能越过什么？', options: ['A. 河界', 'B. 棋子', 'C. 九宫', 'D. 底线'], answer: 0 },
      { id: 3, question: '"士"只能在什么地方走？', options: ['A. 整个棋盘', 'B. 九宫内', 'C. 己方半场', 'D. 河界两边'], answer: 1 },
      { id: 4, question: '下列哪种棋子可以过河？', options: ['A. 象', 'B. 士', 'C. 兵', 'D. 将'], answer: 2 }
    ]
  },
  {
    id: 5,
    name: '楷书基本笔法',
    category: '书',
    teacher: '右军先生',
    startTime: '每周三、六 辰时',
    description: '本课程教授楷书的基本笔画和结构，包括横、竖、撇、捺、点、折等基本笔法。学员将通过临摹名家碑帖，掌握楷书的书写要领，打下扎实的书法基础。',
    maxStudents: 20,
    enrolledCount: 18,
    questions: [
      { id: 1, question: '"永字八法"中的"永"字包含几种基本笔画？', options: ['A. 六种', 'B. 七种', 'C. 八种', 'D. 九种'], answer: 2 },
      { id: 2, question: '书法中的"文房四宝"是指什么？', options: ['A. 琴棋书画', 'B. 笔墨纸砚', 'C. 诗词歌赋', 'D. 梅兰竹菊'], answer: 1 },
      { id: 3, question: '王羲之被后人尊称为？', options: ['A. 书圣', 'B. 画圣', 'C. 诗圣', 'D. 茶圣'], answer: 0 },
      { id: 4, question: '楷书又被称为？', options: ['A. 真书', 'B. 行书', 'C. 草书', 'D. 隶书'], answer: 0 }
    ]
  },
  {
    id: 6,
    name: '行书入门技法',
    category: '书',
    teacher: '东坡居士',
    startTime: '每周二、四 午时',
    description: '行书介于楷书和草书之间，书写流畅且易于辨认。本课程教授行书的基本笔法和结构特点，学习如何将楷书笔画简化、连带，提高书写速度和艺术性。',
    maxStudents: 18,
    enrolledCount: 12,
    questions: [
      { id: 1, question: '行书的特点是什么？', options: ['A. 工整规范', 'B. 流畅简捷', 'C. 龙飞凤舞', 'D. 古朴典雅'], answer: 1 },
      { id: 2, question: '《兰亭序》是谁的作品？', options: ['A. 颜真卿', 'B. 柳公权', 'C. 王羲之', 'D. 欧阳询'], answer: 2 },
      { id: 3, question: '行书是在什么书体基础上演变的？', options: ['A. 篆书', 'B. 隶书', 'C. 楷书', 'D. 草书'], answer: 2 }
    ]
  },
  {
    id: 7,
    name: '山水画基础',
    category: '画',
    teacher: '荆浩先生',
    startTime: '每周一、五 申时',
    description: '本课程教授中国山水画的基本技法，包括山石、云水、树木的画法。学员将学习皴法、点苔、渲染等传统技法，体会山水画"以形写神"的艺术追求。',
    maxStudents: 16,
    enrolledCount: 14,
    questions: [
      { id: 1, question: '中国画中的"皴法"主要用于表现什么？', options: ['A. 人物表情', 'B. 山石纹理', 'C. 花鸟形态', 'D. 建筑结构'], answer: 1 },
      { id: 2, question: '山水画中的"三远法"不包括？', options: ['A. 高远', 'B. 深远', 'C. 平远', 'D. 低远'], answer: 3 },
      { id: 3, question: '中国山水画主要用什么颜色？', options: ['A. 五彩斑斓', 'B. 水墨为主', 'C. 金色为主', 'D. 红色为主'], answer: 1 },
      { id: 4, question: '"泼墨山水"的特点是？', options: ['A. 精细描绘', 'B. 豪放洒脱', 'C. 工整细腻', 'D. 色彩艳丽'], answer: 1 }
    ]
  },
  {
    id: 8,
    name: '花鸟画入门',
    category: '画',
    teacher: '黄筌先生',
    startTime: '每周三、日 巳时',
    description: '本课程教授中国花鸟画的基本技法，包括花卉、禽鸟、草虫的画法。学员将学习工笔和写意两种基本画法，体会花鸟画"托物言志"的艺术特色。',
    maxStudents: 20,
    enrolledCount: 8,
    questions: [
      { id: 1, question: '花鸟画中的"四君子"是指什么？', options: ['A. 春夏秋冬', 'B. 梅兰竹菊', 'C. 琴棋书画', 'D. 笔墨纸砚'], answer: 1 },
      { id: 2, question: '工笔画的特点是？', options: ['A. 豪放', 'B. 精细工整', 'C. 简练', 'D. 抽象'], answer: 1 },
      { id: 3, question: '写意画的特点是？', options: ['A. 精细入微', 'B. 简练豪放', 'C. 色彩鲜艳', 'D. 人物为主'], answer: 1 }
    ]
  }
];

const users: User[] = [
  {
    id: 1,
    name: '苏子瞻',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student1',
    grade: '太学三年级',
    role: 'student',
    enrolledCourses: [
      { courseId: 1, completed: true, score: 30 },
      { courseId: 3, completed: true, score: 40 },
      { courseId: 5, completed: false, score: 0 }
    ],
    totalScore: 70
  },
  {
    id: 2,
    name: '黄庭坚',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student2',
    grade: '太学二年级',
    role: 'student',
    enrolledCourses: [
      { courseId: 1, completed: true, score: 40 },
      { courseId: 5, completed: true, score: 30 },
      { courseId: 7, completed: false, score: 0 }
    ],
    totalScore: 70
  },
  {
    id: 3,
    name: '秦少游',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student3',
    grade: '太学一年级',
    role: 'student',
    enrolledCourses: [
      { courseId: 3, completed: true, score: 50 },
      { courseId: 4, completed: true, score: 20 }
    ],
    totalScore: 70
  },
  {
    id: 4,
    name: '米元章',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student4',
    grade: '太学三年级',
    role: 'student',
    enrolledCourses: [
      { courseId: 5, completed: true, score: 40 },
      { courseId: 6, completed: true, score: 30 },
      { courseId: 7, completed: true, score: 20 }
    ],
    totalScore: 90
  },
  {
    id: 5,
    name: '晁补之',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student5',
    grade: '太学二年级',
    role: 'student',
    enrolledCourses: [
      { courseId: 1, completed: true, score: 20 },
      { courseId: 3, completed: false, score: 0 }
    ],
    totalScore: 20
  },
  {
    id: 6,
    name: '张择端',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student6',
    grade: '太学一年级',
    role: 'student',
    enrolledCourses: [
      { courseId: 7, completed: true, score: 40 },
      { courseId: 8, completed: true, score: 30 },
      { courseId: 5, completed: true, score: 20 }
    ],
    totalScore: 90
  },
  {
    id: 7,
    name: '李太白',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student7',
    grade: '太学三年级',
    role: 'student',
    enrolledCourses: [
      { courseId: 2, completed: true, score: 30 },
      { courseId: 6, completed: true, score: 20 }
    ],
    totalScore: 50
  },
  {
    id: 8,
    name: '杜子美',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student8',
    grade: '太学二年级',
    role: 'student',
    enrolledCourses: [
      { courseId: 1, completed: true, score: 10 },
      { courseId: 3, completed: true, score: 20 },
      { courseId: 5, completed: true, score: 10 },
      { courseId: 7, completed: true, score: 10 }
    ],
    totalScore: 50
  },
  {
    id: 9,
    name: '王摩诘',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student9',
    grade: '太学三年级',
    role: 'student',
    enrolledCourses: [
      { courseId: 1, completed: true, score: 40 },
      { courseId: 7, completed: true, score: 40 },
      { courseId: 5, completed: true, score: 30 }
    ],
    totalScore: 110
  },
  {
    id: 10,
    name: '韩退之',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student10',
    grade: '太学一年级',
    role: 'student',
    enrolledCourses: [
      { courseId: 5, completed: true, score: 20 },
      { courseId: 6, completed: false, score: 0 }
    ],
    totalScore: 20
  },
  {
    id: 100,
    name: '欧阳修',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher1',
    grade: '书院山长',
    role: 'teacher',
    enrolledCourses: [],
    totalScore: 0
  }
];

let currentUserId = 1;

app.get('/api/courses', (req, res) => {
  const { category } = req.query;
  if (category) {
    const filtered = courses.filter(c => c.category === category);
    res.json(filtered);
  } else {
    res.json(courses);
  }
});

app.get('/api/courses/:id', (req, res) => {
  const course = courses.find(c => c.id === parseInt(req.params.id));
  if (course) {
    res.json(course);
  } else {
    res.status(404).json({ error: '课程不存在' });
  }
});

app.get('/api/user', (req, res) => {
  const user = users.find(u => u.id === currentUserId);
  if (user) {
    res.json(user);
  } else {
    res.status(404).json({ error: '用户不存在' });
  }
});

app.post('/api/user/role', (req, res) => {
  const { role } = req.body;
  if (role === 'teacher') {
    currentUserId = 100;
  } else {
    currentUserId = 1;
  }
  const user = users.find(u => u.id === currentUserId);
  res.json(user);
});

app.post('/api/courses/:id/enroll', (req, res) => {
  const courseId = parseInt(req.params.id);
  const course = courses.find(c => c.id === courseId);
  const user = users.find(u => u.id === currentUserId);

  if (!course) {
    return res.status(404).json({ error: '课程不存在' });
  }
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  if (course.enrolledCount >= course.maxStudents) {
    return res.status(400).json({ error: '课程已满' });
  }
  if (user.enrolledCourses.some(ec => ec.courseId === courseId)) {
    return res.status(400).json({ error: '已预约该课程' });
  }

  course.enrolledCount++;
  user.enrolledCourses.push({ courseId, completed: false, score: 0 });
  
  res.json({ success: true, course, user });
});

app.post('/api/courses/:id/submit-quiz', (req, res) => {
  const courseId = parseInt(req.params.id);
  const { answers } = req.body;
  const course = courses.find(c => c.id === courseId);
  const user = users.find(u => u.id === currentUserId);

  if (!course || !user) {
    return res.status(404).json({ error: '课程或用户不存在' });
  }

  let score = 0;
  course.questions.forEach((q, index) => {
    if (answers[index] === q.answer) {
      score += 10;
    }
  });

  const enrollment = user.enrolledCourses.find(ec => ec.courseId === courseId);
  if (enrollment) {
    enrollment.completed = true;
    enrollment.score = Math.max(enrollment.score, score);
  }

  user.totalScore = users
    .filter(u => u.role === 'student')
    .reduce((sum, u) => sum + u.enrolledCourses.reduce((s, ec) => s + ec.score, 0), 0);

  const leaderboard = users
    .filter(u => u.role === 'student')
    .map(u => ({
      id: u.id,
      name: u.name,
      totalScore: u.enrolledCourses.reduce((s, ec) => s + ec.score, 0)
    }))
    .sort((a, b) => b.totalScore - a.totalScore);

  res.json({ score, totalQuestions: course.questions.length, leaderboard });
});

app.get('/api/leaderboard', (req, res) => {
  const leaderboard = users
    .filter(u => u.role === 'student')
    .map(u => ({
      id: u.id,
      name: u.name,
      avatar: u.avatar,
      totalScore: u.enrolledCourses.reduce((s, ec) => s + ec.score, 0)
    }))
    .sort((a, b) => b.totalScore - a.totalScore);

  res.json(leaderboard);
});

app.get('/api/teacher/stats', (req, res) => {
  const students = users.filter(u => u.role === 'student');
  
  const scoreDistribution = [
    { range: '0-50', count: 0 },
    { range: '50-70', count: 0 },
    { range: '70-90', count: 0 },
    { range: '90-100', count: 0 }
  ];

  students.forEach(student => {
    const totalScore = student.enrolledCourses.reduce((s, ec) => s + ec.score, 0);
    if (totalScore < 50) scoreDistribution[0].count++;
    else if (totalScore < 70) scoreDistribution[1].count++;
    else if (totalScore < 90) scoreDistribution[2].count++;
    else scoreDistribution[3].count++;
  });

  const courseCompletion = courses.map(course => ({
    id: course.id,
    name: course.name,
    category: course.category,
    enrolledCount: course.enrolledCount,
    maxStudents: course.maxStudents,
    completionRate: students.filter(s => 
      s.enrolledCourses.some(ec => ec.courseId === course.id && ec.completed)
    ).length
  }));

  res.json({ scoreDistribution, courseCompletion, totalStudents: students.length });
});

app.post('/api/teacher/courses', (req, res) => {
  const { name, category, teacher, startTime, description, maxStudents } = req.body;
  
  const newCourse: Course = {
    id: courses.length + 1,
    name,
    category,
    teacher,
    startTime,
    description,
    maxStudents,
    enrolledCount: 0,
    questions: [
      { id: 1, question: '这是一道示例题目？', options: ['A. 选项一', 'B. 选项二', 'C. 选项三', 'D. 选项四'], answer: 0 },
      { id: 2, question: '这是第二道示例题？', options: ['A. 选项一', 'B. 选项二', 'C. 选项三', 'D. 选项四'], answer: 1 },
      { id: 3, question: '这是第三道示例题？', options: ['A. 选项一', 'B. 选项二', 'C. 选项三', 'D. 选项四'], answer: 2 }
    ]
  };
  
  courses.push(newCourse);
  res.json(newCourse);
});

app.put('/api/teacher/courses/:id', (req, res) => {
  const courseId = parseInt(req.params.id);
  const course = courses.find(c => c.id === courseId);
  
  if (!course) {
    return res.status(404).json({ error: '课程不存在' });
  }
  
  const { name, category, teacher, startTime, description, maxStudents } = req.body;
  
  if (name) course.name = name;
  if (category) course.category = category;
  if (teacher) course.teacher = teacher;
  if (startTime) course.startTime = startTime;
  if (description) course.description = description;
  if (maxStudents !== undefined) course.maxStudents = maxStudents;
  
  res.json(course);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
