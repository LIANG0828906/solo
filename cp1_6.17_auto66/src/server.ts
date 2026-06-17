import express, { Request, Response } from 'express';
import cors from 'cors';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateId } from './utils.js';
import type { Course, Chapter, Assignment, Submission, StudentProgress, Database } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const file = path.join(__dirname, 'db.json');
const adapter = new JSONFile<Database>(file);
const db = new Low<Database>(adapter, {
  courses: [],
  assignments: [],
  submissions: [],
});

async function initDb() {
  await db.read();
  
  if (!db.data.courses.length) {
    const courseId1 = generateId();
    const chapterId1 = generateId();
    const chapterId2 = generateId();
    const chapterId3 = generateId();
    const chapterId11 = generateId();
    const chapterId12 = generateId();
    
    db.data.courses = [
      {
        id: courseId1,
        title: '前端开发进阶课程',
        createdAt: Date.now() - 86400000 * 7,
        chapters: [
          {
            id: chapterId1,
            name: '第一章 React 基础',
            order: 0,
            expanded: true,
            children: [
              { id: chapterId11, name: '1.1 JSX 语法详解', order: 0, children: [], expanded: false },
              { id: chapterId12, name: '1.2 组件与 Props', order: 1, children: [], expanded: false },
            ],
          },
          { id: chapterId2, name: '第二章 状态管理', order: 1, children: [], expanded: false },
          { id: chapterId3, name: '第三章 性能优化', order: 2, children: [], expanded: false },
        ],
      },
    ];
    
    db.data.assignments = [
      {
        id: generateId(),
        chapterId: chapterId11,
        title: 'JSX 语法练习',
        description: '请使用 JSX 语法创建一个包含列表、条件渲染的组件，并提交代码链接。',
        attachmentUrl: 'https://example.com/jsx-guide.pdf',
        createdAt: Date.now() - 86400000 * 3,
      },
    ];
    
    db.data.submissions = [
      {
        id: generateId(),
        assignmentId: db.data.assignments[0].id,
        studentId: 'stu001',
        studentName: '张三',
        content: '我完成了JSX练习，使用了map渲染列表和三元运算符进行条件渲染。\n\n代码主要包含：\n1. 用户列表组件\n2. 加载状态处理\n3. 空状态展示',
        fileUrl: 'https://github.com/example/jsx-practice',
        submittedAt: Date.now() - 3600000 * 2,
        status: 'pending',
      },
      {
        id: generateId(),
        assignmentId: db.data.assignments[0].id,
        studentId: 'stu002',
        studentName: '李四',
        content: '作业已完成，包含了JSX的各种语法特性。',
        fileUrl: 'https://github.com/example/jsx-homework',
        submittedAt: Date.now() - 86400000,
        status: 'graded',
        grade: 92,
        feedback: '代码结构清晰，命名规范，很好地掌握了JSX语法。建议进一步学习Fragment的使用场景。',
        gradedAt: Date.now() - 3600000 * 20,
      },
    ];
    
    await db.write();
  }
}

initDb().catch(console.error);

function findChapter(chapters: Chapter[], id: string): Chapter | null {
  for (const chapter of chapters) {
    if (chapter.id === id) return chapter;
    if (chapter.children.length > 0) {
      const found = findChapter(chapter.children, id);
      if (found) return found;
    }
  }
  return null;
}

function updateChapterInTree(chapters: Chapter[], id: string, updater: (ch: Chapter) => Chapter): Chapter[] {
  return chapters.map(ch => {
    if (ch.id === id) {
      return updater(ch);
    }
    if (ch.children.length > 0) {
      return { ...ch, children: updateChapterInTree(ch.children, id, updater) };
    }
    return ch;
  });
}

function deleteChapterFromTree(chapters: Chapter[], id: string): Chapter[] {
  return chapters
    .filter(ch => ch.id !== id)
    .map(ch => ({
      ...ch,
      children: deleteChapterFromTree(ch.children, id),
    }));
}

function addChapterToParent(chapters: Chapter[], parentId: string | undefined, newChapter: Chapter): Chapter[] {
  if (!parentId) {
    return [...chapters, newChapter];
  }
  return chapters.map(ch => {
    if (ch.id === parentId) {
      return { ...ch, children: [...ch.children, newChapter] };
    }
    if (ch.children.length > 0) {
      return { ...ch, children: addChapterToParent(ch.children, parentId, newChapter) };
    }
    return ch;
  });
}

app.get('/api/courses', async (_req: Request, res: Response<Course[]>) => {
  await db.read();
  res.json(db.data.courses);
});

app.post('/api/courses', async (req: Request<{}, Course, { title: string }>, res: Response<Course>) => {
  await db.read();
  const newCourse: Course = {
    id: generateId(),
    title: req.body.title,
    chapters: [],
    createdAt: Date.now(),
  };
  db.data.courses.push(newCourse);
  await db.write();
  res.json(newCourse);
});

app.put('/api/courses/:id/chapter', async (
  req: Request<{ id: string }, Course, { chapter: Chapter; parentId?: string }>,
  res: Response<Course | { error: string }>
) => {
  await db.read();
  const course = db.data.courses.find(c => c.id === req.params.id);
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }
  
  const { chapter, parentId } = req.body;
  const existingChapter = findChapter(course.chapters, chapter.id);
  
  if (existingChapter) {
    course.chapters = updateChapterInTree(course.chapters, chapter.id, () => chapter);
  } else {
    const newChapter: Chapter = {
      ...chapter,
      id: chapter.id || generateId(),
      children: chapter.children || [],
    };
    course.chapters = addChapterToParent(course.chapters, parentId, newChapter);
  }
  
  await db.write();
  res.json(course);
});

app.delete('/api/courses/:courseId/chapter/:chapterId', async (
  req: Request<{ courseId: string; chapterId: string }, { success: boolean }>,
  res: Response<{ success: boolean; error?: string }>
) => {
  await db.read();
  const course = db.data.courses.find(c => c.id === req.params.courseId);
  if (!course) {
    return res.status(404).json({ success: false, error: 'Course not found' });
  }
  
  course.chapters = deleteChapterFromTree(course.chapters, req.params.chapterId);
  await db.write();
  res.json({ success: true });
});

app.put('/api/courses/:id/reorder', async (
  req: Request<{ id: string }, Course, { chapters: Chapter[] }>,
  res: Response<Course | { error: string }>
) => {
  await db.read();
  const course = db.data.courses.find(c => c.id === req.params.id);
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }
  
  course.chapters = req.body.chapters;
  await db.write();
  res.json(course);
});

app.post('/api/assignments', async (
  req: Request<{}, Assignment, Omit<Assignment, 'id' | 'createdAt'>>,
  res: Response<Assignment>
) => {
  await db.read();
  const newAssignment: Assignment = {
    ...req.body,
    id: generateId(),
    createdAt: Date.now(),
  };
  db.data.assignments.push(newAssignment);
  await db.write();
  res.json(newAssignment);
});

app.get('/api/assignments/:chapterId', async (
  req: Request<{ chapterId: string }, Assignment[]>,
  res: Response<Assignment[]>
) => {
  await db.read();
  const assignments = db.data.assignments.filter(a => a.chapterId === req.params.chapterId);
  res.json(assignments);
});

app.get('/api/submissions/:assignmentId', async (
  req: Request<{ assignmentId: string }, Submission[]>,
  res: Response<Submission[]>
) => {
  await db.read();
  const submissions = db.data.submissions.filter(s => s.assignmentId === req.params.assignmentId);
  res.json(submissions.sort((a, b) => b.submittedAt - a.submittedAt));
});

app.post('/api/submissions', async (
  req: Request<{}, Submission, Omit<Submission, 'id' | 'submittedAt' | 'status'>>,
  res: Response<Submission>
) => {
  await db.read();
  const newSubmission: Submission = {
    ...req.body,
    id: generateId(),
    submittedAt: Date.now(),
    status: 'pending',
  };
  db.data.submissions.push(newSubmission);
  await db.write();
  res.json(newSubmission);
});

app.put('/api/submissions/:id/grade', async (
  req: Request<{ id: string }, Submission, { grade: number; feedback: string }>,
  res: Response<Submission | { error: string }>
) => {
  await db.read();
  const submission = db.data.submissions.find(s => s.id === req.params.id);
  if (!submission) {
    return res.status(404).json({ error: 'Submission not found' });
  }
  
  submission.grade = req.body.grade;
  submission.feedback = req.body.feedback;
  submission.status = 'graded';
  submission.gradedAt = Date.now();
  
  await db.write();
  res.json(submission);
});

app.get('/api/progress/:studentId', async (
  req: Request<{ studentId: string }, StudentProgress>,
  res: Response<StudentProgress | { error: string }>
) => {
  await db.read();
  
  const studentSubmissions = db.data.submissions.filter(s => s.studentId === req.params.studentId);
  const gradedSubmissions = studentSubmissions
    .filter(s => s.status === 'graded')
    .sort((a, b) => (b.gradedAt || 0) - (a.gradedAt || 0))
    .slice(0, 3);
  
  const course = db.data.courses[0];
  if (!course) {
    return res.status(404).json({ error: 'No course found' });
  }
  
  const allChapterIds: string[] = [];
  const collectChapterIds = (chapters: Chapter[]) => {
    chapters.forEach(ch => {
      allChapterIds.push(ch.id);
      if (ch.children.length > 0) {
        collectChapterIds(ch.children);
      }
    });
  };
  collectChapterIds(course.chapters);
  
  const getChapterName = (id: string): string => {
    const ch = findChapter(course.chapters, id);
    return ch?.name || '未知章节';
  };
  
  const chaptersProgress = allChapterIds.map(chapterId => {
    const chapterAssignments = db.data.assignments.filter(a => a.chapterId === chapterId);
    const chapterSubmissions = chapterAssignments.flatMap(a => 
      studentSubmissions.filter(s => s.assignmentId === a.id)
    );
    
    let completion = 0;
    if (chapterAssignments.length > 0) {
      const gradedCount = chapterSubmissions.filter(s => s.status === 'graded').length;
      completion = Math.round((gradedCount / chapterAssignments.length) * 100);
    }
    
    return {
      chapterId,
      chapterName: getChapterName(chapterId),
      completion,
    };
  });
  
  const progress: StudentProgress = {
    studentId: req.params.studentId,
    studentName: studentSubmissions[0]?.studentName || '学生',
    chapters: chaptersProgress,
    recentGraded: gradedSubmissions,
  };
  
  res.json(progress);
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
