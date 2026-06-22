import type { Course, UserProgress, DailyActivity } from '../../shared/types';

const courses: Course[] = [
  {
    id: 'course-1',
    name: 'HTML 基础入门',
    description: '学习HTML的基本标签、语义化结构和表单处理，构建静态网页的基础。',
    prerequisites: [],
    knowledgePoints: ['HTML', '语义化', '表单'],
    estimatedMinutes: 240
  },
  {
    id: 'course-2',
    name: 'CSS 样式设计',
    description: '掌握CSS选择器、盒模型、Flexbox和Grid布局，以及响应式设计原理。',
    prerequisites: ['course-1'],
    knowledgePoints: ['CSS', 'Flexbox', 'Grid', '响应式'],
    estimatedMinutes: 300
  },
  {
    id: 'course-3',
    name: 'JavaScript 核心编程',
    description: '深入学习JavaScript语法、异步编程、DOM操作和ES6+新特性。',
    prerequisites: ['course-1'],
    knowledgePoints: ['JavaScript', 'ES6', '异步编程', 'DOM'],
    estimatedMinutes: 480
  },
  {
    id: 'course-4',
    name: 'React 前端框架',
    description: '学习React组件化开发、Hooks、状态管理和虚拟DOM原理。',
    prerequisites: ['course-2', 'course-3'],
    knowledgePoints: ['React', 'Hooks', '状态管理', '虚拟DOM'],
    estimatedMinutes: 600
  },
  {
    id: 'course-5',
    name: 'Node.js 后端开发',
    description: '使用Node.js和Express构建RESTful API，理解中间件和路由机制。',
    prerequisites: ['course-3'],
    knowledgePoints: ['Node.js', 'Express', 'REST API', '中间件'],
    estimatedMinutes: 420
  },
  {
    id: 'course-6',
    name: 'TypeScript 类型系统',
    description: '掌握TypeScript类型系统、泛型、接口和高级类型操作。',
    prerequisites: ['course-3'],
    knowledgePoints: ['TypeScript', '类型系统', '泛型', '接口'],
    estimatedMinutes: 360
  },
  {
    id: 'course-7',
    name: '数据库设计与SQL',
    description: '学习关系型数据库设计、SQL查询、索引优化和事务处理。',
    prerequisites: [],
    knowledgePoints: ['SQL', '数据库', '索引', '事务'],
    estimatedMinutes: 360
  },
  {
    id: 'course-8',
    name: '全栈项目实战',
    description: '综合运用前后端技术，构建完整的Web应用并部署上线。',
    prerequisites: ['course-4', 'course-5', 'course-7'],
    knowledgePoints: ['全栈', '部署', '项目管理'],
    estimatedMinutes: 900
  },
  {
    id: 'course-9',
    name: '算法与数据结构',
    description: '学习常用数据结构、排序搜索算法和动态规划思想。',
    prerequisites: ['course-3'],
    knowledgePoints: ['算法', '数据结构', '动态规划'],
    estimatedMinutes: 720
  },
  {
    id: 'course-10',
    name: '前端工程化实践',
    description: '掌握Webpack/Vite构建工具、代码规范、单元测试和CI/CD流程。',
    prerequisites: ['course-4', 'course-6'],
    knowledgePoints: ['工程化', '构建工具', '测试', 'CI/CD'],
    estimatedMinutes: 480
  }
];

const generateInitialProgress = (): UserProgress[] => [
  {
    courseId: 'course-1',
    status: 'completed',
    testScore: 92,
    minutesSpent: 210,
    lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    courseId: 'course-2',
    status: 'completed',
    testScore: 85,
    minutesSpent: 280,
    lastUpdated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    courseId: 'course-3',
    status: 'in_progress',
    testScore: 78,
    minutesSpent: 320,
    lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const generateDailyActivity = (): DailyActivity[] => {
  const result: DailyActivity[] = [];
  const now = new Date();
  const defaultMinutes = [45, 60, 30, 90, 75, 0, 80];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    result.push({
      date: date.toISOString().split('T')[0],
      minutes: defaultMinutes[6 - i]
    });
  }
  return result;
};

export class Storage {
  private courses: Course[] = courses;
  private userProgress: UserProgress[] = generateInitialProgress();
  private dailyActivity: DailyActivity[] = generateDailyActivity();

  getAllCourses(): Course[] {
    return this.courses;
  }

  getCourseById(id: string): Course | undefined {
    return this.courses.find(c => c.id === id);
  }

  getUserProgress(): UserProgress[] {
    return this.userProgress;
  }

  getProgressByCourseId(courseId: string): UserProgress | undefined {
    return this.userProgress.find(p => p.courseId === courseId);
  }

  updateProgress(progress: UserProgress): UserProgress {
    const index = this.userProgress.findIndex(p => p.courseId === progress.courseId);
    progress.lastUpdated = new Date().toISOString();
    if (index >= 0) {
      this.userProgress[index] = progress;
    } else {
      this.userProgress.push(progress);
    }
    this.updateDailyActivity(progress.minutesSpent);
    return progress;
  }

  private updateDailyActivity(minutesSpent: number): void {
    const today = new Date().toISOString().split('T')[0];
    const todayEntry = this.dailyActivity.find(d => d.date === today);
    if (todayEntry) {
      todayEntry.minutes = Math.max(todayEntry.minutes, minutesSpent);
    } else {
      this.dailyActivity.push({ date: today, minutes: minutesSpent });
    }
  }

  getDailyActivity(days: number = 7): DailyActivity[] {
    return this.dailyActivity.slice(-days);
  }

  addDailyMinutes(minutes: number): void {
    const today = new Date().toISOString().split('T')[0];
    const todayEntry = this.dailyActivity.find(d => d.date === today);
    if (todayEntry) {
      todayEntry.minutes += minutes;
    } else {
      this.dailyActivity.push({ date: today, minutes });
    }
  }
}

export const storage = new Storage();
