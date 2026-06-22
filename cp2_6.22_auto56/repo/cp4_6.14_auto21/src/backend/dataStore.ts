import { v4 as uuidv4 } from 'uuid';
import {
  Instructor,
  Course,
  Learner,
  Enrollment,
  Chapter,
  Question,
  CreateCourseRequest,
  SubmitAssessmentRequest,
  AssessmentResponse,
  LearnerProgress,
  AnalyticsStats,
  TimeSlotStat,
} from './types';

const presetInstructors: Instructor[] = [
  { id: 'inst-1', name: '张明远', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=instructor1', department: '技术部' },
  { id: 'inst-2', name: '李雪琴', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=instructor2', department: '产品部' },
  { id: 'inst-3', name: '王建国', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=instructor3', department: '设计部' },
  { id: 'inst-4', name: '陈思琪', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=instructor4', department: '人力资源部' },
  { id: 'inst-5', name: '赵文博', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=instructor5', department: '市场部' },
];

const presetLearners: Learner[] = [
  { id: 'learner-1', name: '周小宇', email: 'zhouxy@company.com', department: '技术部', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=learner1' },
  { id: 'learner-2', name: '吴丽娜', email: 'wuln@company.com', department: '产品部', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=learner2' },
  { id: 'learner-3', name: '郑浩然', email: 'zhenghr@company.com', department: '设计部', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=learner3' },
  { id: 'learner-4', name: '孙婉清', email: 'sunwq@company.com', department: '市场部', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=learner4' },
  { id: 'learner-5', name: '钱多多', email: 'qiandd@company.com', department: '技术部', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=learner5' },
  { id: 'learner-6', name: '冯子健', email: 'fengzj@company.com', department: '人力资源部', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=learner6' },
  { id: 'learner-7', name: '陈晓晓', email: 'chenxx@company.com', department: '财务部', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=learner7' },
  { id: 'learner-8', name: '褚时健', email: 'chusj@company.com', department: '运营部', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=learner8' },
  { id: 'learner-9', name: '卫诗雅', email: 'weisya@company.com', department: '技术部', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=learner9' },
  { id: 'learner-10', name: '蒋欣怡', email: 'jiangxy@company.com', department: '产品部', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=learner10' },
  { id: 'learner-11', name: '沈佳怡', email: 'shenjy@company.com', department: '设计部', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=learner11' },
  { id: 'learner-12', name: '韩梅梅', email: 'hanmm@company.com', department: '市场部', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=learner12' },
  { id: 'learner-13', name: '杨晓峰', email: 'yangxf@company.com', department: '技术部', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=learner13' },
  { id: 'learner-14', name: '朱玲玲', email: 'zhull@company.com', department: '人力资源部', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=learner14' },
  { id: 'learner-15', name: '秦书桓', email: 'qinsh@company.com', department: '运营部', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=learner15' },
  { id: 'learner-16', name: '尤佳期', email: 'youjq@company.com', department: '财务部', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=learner16' },
  { id: 'learner-17', name: '许文强', email: 'xuwq@company.com', department: '技术部', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=learner17' },
  { id: 'learner-18', name: '何仙姑', email: 'hexg@company.com', department: '产品部', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=learner18' },
  { id: 'learner-19', name: '吕轻侯', email: 'lvqh@company.com', department: '设计部', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=learner19' },
  { id: 'learner-20', name: '施恩明', email: 'shiem@company.com', department: '市场部', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=learner20' },
];

function generateChapters(): Chapter[] {
  const chapterTitles = [
    '课程导论与目标',
    '核心概念解析',
    '实践方法与技巧',
    '案例分析与讨论',
    '总结与展望',
  ];
  return chapterTitles.map((title, index) => ({
    id: uuidv4(),
    title,
    duration: 30 + Math.floor(Math.random() * 60),
  }));
}

function generateAssessment(): Question[] {
  const questionPool = [
    {
      question: '本课程的主要学习目标是什么？',
      options: ['了解基础概念', '掌握实践技能', '通过考试', '获得证书'],
      correctAnswer: 1,
    },
    {
      question: '以下哪个选项是课程的核心内容？',
      options: ['历史背景', '理论框架', '应用场景', '以上都是'],
      correctAnswer: 3,
    },
    {
      question: '学习本课程需要具备什么基础？',
      options: ['零基础', '相关专业背景', '工作经验', '不需要'],
      correctAnswer: 0,
    },
    {
      question: '课程中提到的最佳实践不包括以下哪项？',
      options: ['持续学习', '团队协作', '独立思考', '闭门造车'],
      correctAnswer: 3,
    },
    {
      question: '学完本课程后，你应该能够：',
      options: ['独立完成项目', '背诵所有知识点', '参加高级课程', '获得升职'],
      correctAnswer: 0,
    },
  ];
  return questionPool.map((q, idx) => ({
    id: uuidv4(),
    question: q.question,
    options: [...q.options],
    correctAnswer: q.correctAnswer,
  }));
}

function generateMockCourses(count: number): Course[] {
  const courses: Course[] = [];
  const courseTitles = [
    'React前端开发实战', 'TypeScript高级编程', 'Node.js后端开发',
    '产品经理入门', '用户体验设计', '数据分析基础',
    '项目管理实务', '团队沟通技巧', '领导力培养',
    '市场营销策略', '人力资源管理', '财务基础知识',
    '人工智能导论', '机器学习实战', '深度学习应用',
    '云原生架构', '微服务设计', 'DevOps实践',
    '敏捷开发方法', '软件测试基础', '安全编码规范',
    '数据库设计', '网络协议基础', '操作系统原理',
    '编译原理入门', '算法与数据结构', '设计模式实战',
    '代码重构技巧', '性能优化指南', '架构设计思维',
  ];

  const today = new Date();
  for (let i = 0; i < count; i++) {
    const instructorIdx = i % presetInstructors.length;
    const dayOffset = Math.floor(Math.random() * 14) - 3;
    const startHour = 9 + Math.floor(Math.random() * 8);
    const duration = 1 + Math.floor(Math.random() * 4);

    const courseDate = new Date(today);
    courseDate.setDate(courseDate.getDate() + dayOffset);
    courseDate.setHours(startHour, 0, 0, 0);

    const endDate = new Date(courseDate);
    endDate.setHours(endDate.getHours() + duration);

    courses.push({
      id: uuidv4(),
      title: courseTitles[i % courseTitles.length] + (i >= courseTitles.length ? ` ${Math.floor(i / courseTitles.length) + 1}` : ''),
      description: `这是一门关于${courseTitles[i % courseTitles.length]}的专业培训课程，内容详实，案例丰富。`,
      instructorId: presetInstructors[instructorIdx].id,
      startTime: courseDate.toISOString(),
      endTime: endDate.toISOString(),
      duration,
      chapters: generateChapters(),
      assessment: generateAssessment(),
      createdAt: new Date().toISOString(),
    });
  }
  return courses;
}

function generateMockEnrollments(courses: Course[], learners: Learner[]): Enrollment[] {
  const enrollments: Enrollment[] = [];
  learners.forEach((learner) => {
    const enrolledCourseIds = new Set<string>();
    const numEnrollments = 3 + Math.floor(Math.random() * 5);
    for (let i = 0; i < numEnrollments; i++) {
      const course = courses[Math.floor(Math.random() * courses.length)];
      if (enrolledCourseIds.has(course.id)) continue;
      enrolledCourseIds.add(course.id);

      const numCompletedChapters = Math.floor(Math.random() * (course.chapters.length + 1));
      const completedChapters = course.chapters.slice(0, numCompletedChapters).map((c) => c.id);

      const allChaptersCompleted = numCompletedChapters === course.chapters.length;
      const hasAssessment = allChaptersCompleted && Math.random() > 0.3;
      const assessmentScore = hasAssessment ? Math.floor(60 + Math.random() * 40) : null;

      enrollments.push({
        learnerId: learner.id,
        courseId: course.id,
        enrolledAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        completedChapters,
        assessmentScore,
        completedAt: hasAssessment ? new Date().toISOString() : null,
      });
    }
  });
  return enrollments;
}

class DataStore {
  private instructors: Instructor[] = [...presetInstructors];
  private learners: Learner[] = [...presetLearners];
  private courses: Course[] = [];
  private enrollments: Enrollment[] = [];

  constructor() {
    this.courses = generateMockCourses(50);
    this.enrollments = generateMockEnrollments(this.courses, this.learners);
  }

  getInstructors(): Instructor[] {
    return [...this.instructors];
  }

  getInstructorById(id: string): Instructor | undefined {
    return this.instructors.find((i) => i.id === id);
  }

  getCourses(): Course[] {
    return [...this.courses];
  }

  getCourseById(id: string): Course | undefined {
    return this.courses.find((c) => c.id === id);
  }

  checkScheduleConflict(instructorId: string, startTime: string, duration: number, excludeCourseId?: string): boolean {
    const start = new Date(startTime).getTime();
    const end = start + duration * 60 * 60 * 1000;

    return this.courses.some((course) => {
      if (excludeCourseId && course.id === excludeCourseId) return false;
      if (course.instructorId !== instructorId) return false;

      const courseStart = new Date(course.startTime).getTime();
      const courseEnd = new Date(course.endTime).getTime();

      return start < courseEnd && end > courseStart;
    });
  }

  createCourse(request: CreateCourseRequest): { success: boolean; course?: Course; conflict?: boolean; message?: string } {
    if (request.duration < 1 || request.duration > 4) {
      return { success: false, message: '课程时长必须在1-4小时之间' };
    }

    if (this.checkScheduleConflict(request.instructorId, request.startTime, request.duration)) {
      return { success: false, conflict: true, message: '所选时间段与该讲师的其他课程冲突' };
    }

    const start = new Date(request.startTime);
    const end = new Date(start.getTime() + request.duration * 60 * 60 * 1000);

    const newCourse: Course = {
      id: uuidv4(),
      title: request.title,
      description: request.description,
      instructorId: request.instructorId,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      duration: request.duration,
      chapters: generateChapters(),
      assessment: generateAssessment(),
      createdAt: new Date().toISOString(),
    };

    this.courses.push(newCourse);
    return { success: true, course: newCourse };
  }

  updateCourse(id: string, updates: Partial<CreateCourseRequest>): { success: boolean; course?: Course; conflict?: boolean; message?: string } {
    const course = this.getCourseById(id);
    if (!course) {
      return { success: false, message: '课程不存在' };
    }

    let newStartTime = course.startTime;
    let newDuration = course.duration;
    let newInstructorId = course.instructorId;

    if (updates.startTime) newStartTime = updates.startTime;
    if (updates.duration) newDuration = updates.duration;
    if (updates.instructorId) newInstructorId = updates.instructorId;

    if (this.checkScheduleConflict(newInstructorId, newStartTime, newDuration, id)) {
      return { success: false, conflict: true, message: '调整后的时间段与该讲师的其他课程冲突' };
    }

    const start = new Date(newStartTime);
    const end = new Date(start.getTime() + newDuration * 60 * 60 * 1000);

    const updatedCourse: Course = {
      ...course,
      title: updates.title ?? course.title,
      description: updates.description ?? course.description,
      instructorId: newInstructorId,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      duration: newDuration,
    };

    const index = this.courses.findIndex((c) => c.id === id);
    this.courses[index] = updatedCourse;
    return { success: true, course: updatedCourse };
  }

  deleteCourse(id: string): boolean {
    const index = this.courses.findIndex((c) => c.id === id);
    if (index === -1) return false;
    this.courses.splice(index, 1);
    this.enrollments = this.enrollments.filter((e) => e.courseId !== id);
    return true;
  }

  getLearners(): Learner[] {
    return [...this.learners];
  }

  getLearnerById(id: string): Learner | undefined {
    return this.learners.find((l) => l.id === id);
  }

  enrollCourse(learnerId: string, courseId: string): { success: boolean; enrollment?: Enrollment; message?: string } {
    if (!this.getLearnerById(learnerId)) {
      return { success: false, message: '学员不存在' };
    }
    if (!this.getCourseById(courseId)) {
      return { success: false, message: '课程不存在' };
    }

    const existingEnrollment = this.enrollments.find(
      (e) => e.learnerId === learnerId && e.courseId === courseId
    );
    if (existingEnrollment) {
      return { success: false, message: '您已报名该课程' };
    }

    const enrollment: Enrollment = {
      learnerId,
      courseId,
      enrolledAt: new Date().toISOString(),
      completedChapters: [],
      assessmentScore: null,
      completedAt: null,
    };
    this.enrollments.push(enrollment);
    return { success: true, enrollment };
  }

  getEnrollment(learnerId: string, courseId: string): Enrollment | undefined {
    return this.enrollments.find((e) => e.learnerId === learnerId && e.courseId === courseId);
  }

  getEnrollmentsByLearner(learnerId: string): Enrollment[] {
    return this.enrollments.filter((e) => e.learnerId === learnerId);
  }

  getEnrollmentsByCourse(courseId: string): Enrollment[] {
    return this.enrollments.filter((e) => e.courseId === courseId);
  }

  updateChapterCompletion(
    learnerId: string,
    courseId: string,
    chapterId: string,
    completed: boolean
  ): { success: boolean; enrollment?: Enrollment; message?: string } {
    const enrollment = this.getEnrollment(learnerId, courseId);
    if (!enrollment) {
      return { success: false, message: '未找到报名记录' };
    }

    const course = this.getCourseById(courseId);
    if (!course) {
      return { success: false, message: '课程不存在' };
    }

    const chapterExists = course.chapters.some((c) => c.id === chapterId);
    if (!chapterExists) {
      return { success: false, message: '章节不存在' };
    }

    if (completed) {
      if (!enrollment.completedChapters.includes(chapterId)) {
        enrollment.completedChapters.push(chapterId);
      }
    } else {
      enrollment.completedChapters = enrollment.completedChapters.filter((id) => id !== chapterId);
      enrollment.assessmentScore = null;
      enrollment.completedAt = null;
    }

    return { success: true, enrollment: { ...enrollment } };
  }

  submitAssessment(
    learnerId: string,
    courseId: string,
    request: SubmitAssessmentRequest
  ): { success: boolean; result?: AssessmentResponse; message?: string } {
    const course = this.getCourseById(courseId);
    if (!course) {
      return { success: false, message: '课程不存在' };
    }

    const enrollment = this.getEnrollment(learnerId, courseId);
    if (!enrollment) {
      return { success: false, message: '未找到报名记录' };
    }

    if (enrollment.completedChapters.length !== course.chapters.length) {
      return { success: false, message: '请先完成所有章节再参加考核' };
    }

    const questions = course.assessment;
    if (request.answers.length !== questions.length) {
      return { success: false, message: '答案数量不匹配' };
    }

    let score = 0;
    questions.forEach((question, index) => {
      if (request.answers[index] === question.correctAnswer) {
        score++;
      }
    });

    const percentage = Math.round((score / questions.length) * 100);
    const passed = percentage >= 60;

    enrollment.assessmentScore = percentage;
    if (passed) {
      enrollment.completedAt = new Date().toISOString();
    }

    const result: AssessmentResponse = {
      score,
      total: questions.length,
      percentage,
      passed,
    };

    return { success: true, result };
  }

  getLearnerProgress(learnerId: string): LearnerProgress[] {
    const enrollments = this.getEnrollmentsByLearner(learnerId);
    return enrollments
      .map((enrollment) => {
        const course = this.getCourseById(enrollment.courseId);
        if (!course) return null;

        const progress = course.chapters.length > 0
          ? Math.round((enrollment.completedChapters.length / course.chapters.length) * 100)
          : 0;

        const remainingChapters = course.chapters.length - enrollment.completedChapters.length;

        let status: LearnerProgress['status'] = 'enrolled';
        if (enrollment.assessmentScore !== null) {
          status = 'assessed';
        } else if (enrollment.completedChapters.length === course.chapters.length) {
          status = 'completed';
        } else if (enrollment.completedChapters.length > 0) {
          status = 'in_progress';
        }

        return { course, enrollment, progress, remainingChapters, status };
      })
      .filter((item): item is LearnerProgress => item !== null);
  }

  getAnalyticsStats(): AnalyticsStats {
    const totalCourses = this.courses.length;
    const totalLearners = this.learners.length;

    const assessedEnrollments = this.enrollments.filter((e) => e.assessmentScore !== null);
    const averageScore = assessedEnrollments.length > 0
      ? Math.round(
          assessedEnrollments.reduce((sum, e) => sum + (e.assessmentScore || 0), 0) /
            assessedEnrollments.length
        )
      : 0;

    const completedEnrollments = this.enrollments.filter((e) => e.completedAt !== null);
    const completionRate = this.enrollments.length > 0
      ? Math.round((completedEnrollments.length / this.enrollments.length) * 100)
      : 0;

    return { totalCourses, totalLearners, averageScore, completionRate };
  }

  getTimeSlotStats(): TimeSlotStat[] {
    const slots: { [key: string]: number } = {};

    for (let hour = 8; hour < 18; hour++) {
      slots[`${hour}:00`] = 0;
    }

    this.courses.forEach((course) => {
      const startHour = new Date(course.startTime).getHours();
      const slotKey = `${startHour}:00`;
      if (slots.hasOwnProperty(slotKey)) {
        slots[slotKey]++;
      }
    });

    return Object.entries(slots)
      .map(([slot, count]) => ({ slot, count }))
      .sort((a, b) => a.slot.localeCompare(b.slot));
  }
}

export const dataStore = new DataStore();
