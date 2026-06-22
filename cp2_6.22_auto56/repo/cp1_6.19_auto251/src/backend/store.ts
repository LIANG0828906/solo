import { v4 as uuidv4 } from 'uuid';

export interface Course {
  id: string;
  name: string;
  teacher: string;
  classroom: string;
  dayOfWeek: number;
  startSlot: number;
  duration: number;
  weekType: 'all' | 'odd' | 'even';
  colorTag: 'major' | 'elective' | 'pe' | 'lab';
}

export type CourseInput = Omit<Course, 'id'>;

class CourseStore {
  private courses: Map<string, Course> = new Map();

  constructor() {
    this.initializeDemoData();
  }

  private initializeDemoData(): void {
    const demoCourses: CourseInput[] = [
      {
        name: '高等数学',
        teacher: '张教授',
        classroom: '教学楼A301',
        dayOfWeek: 0,
        startSlot: 0,
        duration: 4,
        weekType: 'all',
        colorTag: 'major',
      },
      {
        name: '大学英语',
        teacher: '李老师',
        classroom: '外语楼B202',
        dayOfWeek: 0,
        startSlot: 6,
        duration: 3,
        weekType: 'all',
        colorTag: 'elective',
      },
      {
        name: '数据结构',
        teacher: '王教授',
        classroom: '计算机楼C401',
        dayOfWeek: 1,
        startSlot: 2,
        duration: 4,
        weekType: 'all',
        colorTag: 'major',
      },
      {
        name: '篮球运动',
        teacher: '陈教练',
        classroom: '体育馆1号场',
        dayOfWeek: 2,
        startSlot: 10,
        duration: 3,
        weekType: 'all',
        colorTag: 'pe',
      },
      {
        name: '物理实验',
        teacher: '刘教授',
        classroom: '实验楼D105',
        dayOfWeek: 2,
        startSlot: 16,
        duration: 4,
        weekType: 'odd',
        colorTag: 'lab',
      },
      {
        name: '计算机网络',
        teacher: '赵教授',
        classroom: '计算机楼C302',
        dayOfWeek: 3,
        startSlot: 4,
        duration: 3,
        weekType: 'all',
        colorTag: 'major',
      },
      {
        name: '心理学导论',
        teacher: '孙老师',
        classroom: '人文楼E201',
        dayOfWeek: 4,
        startSlot: 8,
        duration: 2,
        weekType: 'all',
        colorTag: 'elective',
      },
      {
        name: '操作系统',
        teacher: '周教授',
        classroom: '计算机楼C501',
        dayOfWeek: 1,
        startSlot: 12,
        duration: 3,
        weekType: 'all',
        colorTag: 'major',
      },
    ];

    demoCourses.forEach((course) => {
      const id = uuidv4();
      this.courses.set(id, { ...course, id });
    });
  }

  getAll(): Course[] {
    return Array.from(this.courses.values());
  }

  getById(id: string): Course | undefined {
    return this.courses.get(id);
  }

  create(input: CourseInput): Course {
    const id = uuidv4();
    const course: Course = { ...input, id };
    this.courses.set(id, course);
    return course;
  }

  update(id: string, input: CourseInput): Course | undefined {
    if (!this.courses.has(id)) return undefined;
    const course: Course = { ...input, id };
    this.courses.set(id, course);
    return course;
  }

  delete(id: string): boolean {
    return this.courses.delete(id);
  }

  batchCreate(inputs: CourseInput[]): Course[] {
    return inputs.map((input) => this.create(input));
  }

  clear(): void {
    this.courses.clear();
  }
}

export const courseStore = new CourseStore();
