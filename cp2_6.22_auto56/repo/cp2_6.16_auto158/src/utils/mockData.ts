import { v4 as uuidv4 } from 'uuid';
import type { Student, Course, PracticeRecord, Assignment, User } from '@/types';

export const mockTeacher: User = {
  id: 'teacher-001',
  name: '李老师',
  role: 'teacher',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face',
  email: 'li.teacher@tunetracker.com',
};

export const mockStudents: Student[] = [
  {
    id: 'student-001',
    name: '王小明',
    instrument: '钢琴',
    avatar: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=200&h=200&fit=crop&crop=face',
    level: '中级',
    joinDate: '2025-09-15',
  },
  {
    id: 'student-002',
    name: '张晓燕',
    instrument: '小提琴',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
    level: '初级',
    joinDate: '2026-01-10',
  },
  {
    id: 'student-003',
    name: '刘大伟',
    instrument: '吉他',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
    level: '高级',
    joinDate: '2025-06-20',
  },
  {
    id: 'student-004',
    name: '陈雨琪',
    instrument: '古筝',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face',
    level: '中级',
    joinDate: '2025-11-05',
  },
  {
    id: 'student-005',
    name: '赵子轩',
    instrument: '架子鼓',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop&crop=face',
    level: '初级',
    joinDate: '2026-02-28',
  },
  {
    id: 'student-006',
    name: '孙雨桐',
    instrument: '钢琴',
    avatar: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=200&h=200&fit=crop&crop=face',
    level: '高级',
    joinDate: '2024-12-01',
  },
];

const generateMockCourses = (): Course[] => {
  const courses: Course[] = [];
  const today = new Date();
  const startOfWeek = new Date(today);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);

  const schedule = [
    { dayOffset: 0, hour: 9, studentIndex: 0, duration: 60 },
    { dayOffset: 0, hour: 11, studentIndex: 1, duration: 45 },
    { dayOffset: 1, hour: 10, studentIndex: 2, duration: 60 },
    { dayOffset: 1, hour: 14, studentIndex: 3, duration: 50 },
    { dayOffset: 2, hour: 9, studentIndex: 0, duration: 60 },
    { dayOffset: 2, hour: 15, studentIndex: 4, duration: 45 },
    { dayOffset: 3, hour: 10, studentIndex: 5, duration: 60 },
    { dayOffset: 3, hour: 16, studentIndex: 1, duration: 45 },
    { dayOffset: 4, hour: 9, studentIndex: 2, duration: 60 },
    { dayOffset: 4, hour: 14, studentIndex: 3, duration: 50 },
    { dayOffset: 5, hour: 10, studentIndex: 0, duration: 60 },
    { dayOffset: 5, hour: 15, studentIndex: 4, duration: 45 },
  ];

  schedule.forEach((item, index) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + item.dayOffset);
    date.setHours(item.hour, 0, 0, 0);

    courses.push({
      id: `course-${uuidv4().slice(0, 8)}`,
      studentId: mockStudents[item.studentIndex].id,
      teacherId: mockTeacher.id,
      startTime: date.toISOString(),
      duration: item.duration,
      instrument: mockStudents[item.studentIndex].instrument,
      status: index < 3 ? 'completed' : 'scheduled',
      notes: index % 3 === 0 ? '本周重点练习音阶' : undefined,
    });
  });

  const lastMonth = new Date(today);
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  for (let i = 0; i < 50; i++) {
    const randomDay = Math.floor(Math.random() * 30);
    const randomHour = 9 + Math.floor(Math.random() * 8);
    const date = new Date(lastMonth);
    date.setDate(lastMonth.getDate() + randomDay);
    date.setHours(randomHour, 0, 0, 0);

    const studentIndex = Math.floor(Math.random() * mockStudents.length);
    courses.push({
      id: `course-${uuidv4().slice(0, 8)}`,
      studentId: mockStudents[studentIndex].id,
      teacherId: mockTeacher.id,
      startTime: date.toISOString(),
      duration: [45, 50, 60][Math.floor(Math.random() * 3)],
      instrument: mockStudents[studentIndex].instrument,
      status: 'completed',
    });
  }

  return courses;
};

const generateMockPracticeRecords = (): PracticeRecord[] => {
  const records: PracticeRecord[] = [];
  const today = new Date();

  mockStudents.forEach((student) => {
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const hasPractice = Math.random() > 0.3;
      if (hasPractice) {
        records.push({
          id: `practice-${uuidv4().slice(0, 8)}`,
          studentId: student.id,
          date: date.toISOString(),
          duration: 30 + Math.floor(Math.random() * 90),
          rating: 3 + Math.floor(Math.random() * 3),
          notes: i % 5 === 0 ? '今天练习感觉不错，节奏比之前稳了' : undefined,
        });
      }
    }
  });

  return records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

const generateMockAssignments = (): Assignment[] => {
  const assignments: Assignment[] = [];
  const today = new Date();

  const assignmentTemplates = [
    { title: 'C大调音阶练习', description: '每天练习C大调音阶上下行各10遍，注意手指的力度控制' },
    { title: '乐曲第一段练习', description: '熟练演奏乐曲第一段，速度保持在60BPM' },
    { title: '节奏型练习', description: '掌握八分音符和十六分音符的组合节奏型' },
    { title: '和弦转换练习', description: '练习C、G、Am、F四个和弦的转换' },
    { title: '视唱练习', description: '练习视唱教材第15-20页的旋律' },
  ];

  mockStudents.forEach((student, studentIndex) => {
    assignmentTemplates.forEach((template, index) => {
      const dueDate = new Date(today);
      dueDate.setDate(today.getDate() + (index - 1) * 3);

      let status: Assignment['status'] = 'pending';
      if (index === 0) status = 'submitted';
      else if (index === 1) status = 'approved';
      else if (index === 2) status = 'rejected';

      const createdAt = new Date(today);
      createdAt.setDate(dueDate.getDate() - 7);

      assignments.push({
        id: `assignment-${uuidv4().slice(0, 8)}`,
        studentId: student.id,
        teacherId: mockTeacher.id,
        title: template.title,
        description: template.description,
        dueDate: dueDate.toISOString(),
        status,
        createdAt: createdAt.toISOString(),
        submittedAt: status !== 'pending' ? new Date(dueDate.getTime() - 86400000).toISOString() : undefined,
        feedback: status === 'approved' ? '完成得很好，继续保持！' : status === 'rejected' ? '节奏不太稳定，需要多加练习' : undefined,
      });
    });
  });

  return assignments;
};

export const mockCourses = generateMockCourses();
export const mockPracticeRecords = generateMockPracticeRecords();
export const mockAssignments = generateMockAssignments();

export const getAllMockData = () => ({
  students: mockStudents,
  courses: mockCourses,
  practiceRecords: mockPracticeRecords,
  assignments: mockAssignments,
  currentUser: mockTeacher,
});
