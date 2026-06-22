import { v4 as uuidv4 } from 'uuid';

export interface Question {
  id: string;
  type: 'single' | 'judge';
  content: string;
  options: string[];
  correctAnswer: number;
}

export interface Student {
  id: string;
  name: string;
}

export interface AnswerRecord {
  studentId: string;
  questionIndex: number;
  answer: number;
  timeSpent: number;
  isCorrect: boolean;
  submittedAt: number;
}

export interface Quiz {
  id: string;
  questions: Question[];
  startTime: number;
  status: 'active' | 'ended';
  perQuestionTime: number;
}

export interface Classroom {
  code: string;
  className: string;
  teacherName: string;
  students: Student[];
  currentQuiz: Quiz | null;
  answers: AnswerRecord[];
  createdAt: number;
}

const classrooms = new Map<string, Classroom>();

function generateClassCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function createClassroom(className: string, teacherName: string) {
  let code = generateClassCode();
  while (classrooms.has(code)) {
    code = generateClassCode();
  }

  const classroom: Classroom = {
    code,
    className,
    teacherName,
    students: [],
    currentQuiz: null,
    answers: [],
    createdAt: Date.now(),
  };

  classrooms.set(code, classroom);
  return classroom;
}

export function joinClassroom(code: string, studentName: string, studentId?: string) {
  const classroom = classrooms.get(code);
  if (!classroom) {
    return { success: false as const, error: '课堂不存在' };
  }

  const id = studentId || uuidv4();
  const existing = classroom.students.find((s) => s.id === id);
  if (existing) {
    return { success: true as const, student: existing };
  }

  const student: Student = { id, name: studentName };
  classroom.students.push(student);
  return { success: true as const, student };
}

export function publishQuiz(code: string, questions: Question[]) {
  const classroom = classrooms.get(code);
  if (!classroom) {
    return { success: false as const, error: '课堂不存在' };
  }

  const quiz: Quiz = {
    id: uuidv4(),
    questions,
    startTime: Date.now(),
    status: 'active',
    perQuestionTime: 60,
  };

  classroom.currentQuiz = quiz;
  classroom.answers = [];

  return { success: true as const, quiz };
}

export function submitAnswer(
  code: string,
  studentId: string,
  questionIndex: number,
  answer: number,
  timeSpent: number
) {
  const classroom = classrooms.get(code);
  if (!classroom) {
    return { success: false as const, error: '课堂不存在' };
  }

  if (!classroom.currentQuiz || classroom.currentQuiz.status !== 'active') {
    return { success: false as const, error: '没有进行中的测验' };
  }

  const question = classroom.currentQuiz.questions[questionIndex];
  if (!question) {
    return { success: false as const, error: '题目不存在' };
  }

  const existingIndex = classroom.answers.findIndex(
    (a) => a.studentId === studentId && a.questionIndex === questionIndex
  );

  const isCorrect = answer === question.correctAnswer;

  if (existingIndex >= 0) {
    classroom.answers[existingIndex] = {
      ...classroom.answers[existingIndex],
      answer,
      timeSpent,
      isCorrect,
    };
  } else {
    classroom.answers.push({
      studentId,
      questionIndex,
      answer,
      timeSpent,
      isCorrect,
      submittedAt: Date.now(),
    });
  }

  return { success: true as const };
}

export function getClassroomState(code: string) {
  const classroom = classrooms.get(code);
  if (!classroom) {
    return null;
  }

  return {
    code: classroom.code,
    className: classroom.className,
    teacherName: classroom.teacherName,
    studentCount: classroom.students.length,
    students: classroom.students,
    currentQuiz: classroom.currentQuiz,
    answers: classroom.answers,
  };
}

export function endQuiz(code: string) {
  const classroom = classrooms.get(code);
  if (!classroom) {
    return { success: false as const, error: '课堂不存在' };
  }

  if (classroom.currentQuiz) {
    classroom.currentQuiz.status = 'ended';
  }

  return { success: true as const };
}

export function getQuizReport(code: string) {
  const classroom = classrooms.get(code);
  if (!classroom || !classroom.currentQuiz) {
    return null;
  }

  const { questions, answers, students } = classroom;

  const questionStats = questions.map((q, qIndex) => {
    const questionAnswers = answers.filter((a) => a.questionIndex === qIndex);
    const correctCount = questionAnswers.filter((a) => a.isCorrect).length;
    const totalCount = questionAnswers.length;
    const avgTime =
      totalCount > 0
        ? questionAnswers.reduce((sum, a) => sum + a.timeSpent, 0) / totalCount
        : 0;

    const studentAnswers = students.map((student) => {
      const ans = questionAnswers.find((a) => a.studentId === student.id);
      return {
        studentId: student.id,
        studentName: student.name,
        answer: ans?.answer ?? null,
        timeSpent: ans?.timeSpent ?? 0,
        isCorrect: ans?.isCorrect ?? false,
        answered: !!ans,
      };
    });

    return {
      questionIndex: qIndex,
      question: q,
      correctCount,
      wrongCount: totalCount - correctCount,
      totalCount,
      avgTime,
      accuracy: totalCount > 0 ? correctCount / totalCount : 0,
      studentAnswers,
    };
  });

  const totalAnsweredStudents = new Set(answers.map((a) => a.studentId)).size;
  const totalQuestions = questions.length;
  const correctAnswers = answers.filter((a) => a.isCorrect).length;
  const totalAnswers = answers.length;
  const overallAccuracy = totalAnswers > 0 ? correctAnswers / totalAnswers : 0;

  const studentStats = students.map((student) => {
    const studentAnswers = answers.filter((a) => a.studentId === student.id);
    const correctCount = studentAnswers.filter((a) => a.isCorrect).length;
    const totalTime = studentAnswers.reduce((sum, a) => sum + a.timeSpent, 0);
    return {
      studentId: student.id,
      studentName: student.name,
      correctCount,
      totalQuestions,
      totalTime,
      accuracy: totalQuestions > 0 ? correctCount / totalQuestions : 0,
    };
  });

  return {
    className: classroom.className,
    teacherName: classroom.teacherName,
    studentCount: students.length,
    totalQuestions,
    overallAccuracy,
    questionStats,
    studentStats,
    generatedAt: Date.now(),
  };
}
