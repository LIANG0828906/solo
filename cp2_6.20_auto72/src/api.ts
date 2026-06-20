import axios from 'axios';
import type { Quiz, Score, Answer } from './types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const quizApi = {
  async getQuizzes(): Promise<Quiz[]> {
    try {
      const response = await api.get('/quizzes');
      return response.data;
    } catch {
      return getMockQuizzes();
    }
  },

  async getQuiz(id: string): Promise<Quiz | null> {
    try {
      const response = await api.get(`/quizzes/${id}`);
      return response.data;
    } catch {
      const quizzes = getMockQuizzes();
      return quizzes.find((q) => q.id === id) || null;
    }
  },

  async submitQuiz(
    quizId: string,
    studentName: string,
    answers: Answer[]
  ): Promise<Score> {
    try {
      const response = await api.post('/quizzes/submit', {
        quizId,
        studentName,
        answers,
      });
      return response.data;
    } catch {
      return calculateMockScore(quizId, studentName, answers);
    }
  },

  async getAllScores(quizId?: string): Promise<Score[]> {
    try {
      const url = quizId ? `/scores?quizId=${quizId}` : '/scores';
      const response = await api.get(url);
      return response.data;
    } catch {
      return getMockScores();
    }
  },

  async getScoreDetail(scoreId: string): Promise<Score | null> {
    try {
      const response = await api.get(`/scores/${scoreId}`);
      return response.data;
    } catch {
      const scores = getMockScores();
      return scores.find((s) => s.quizId === scoreId) || scores[0] || null;
    }
  },
};

function getMockQuizzes(): Quiz[] {
  return [
    {
      id: 'quiz-1',
      title: 'JavaScript 基础测验',
      createdAt: '2026-06-15T10:00:00Z',
      questions: [
        {
          id: 'q1',
          type: 'choice',
          content: '以下哪个不是 JavaScript 的基本数据类型？',
          options: ['String', 'Number', 'Array', 'Boolean'],
          answer: 'Array',
          score: 10,
        },
        {
          id: 'q2',
          type: 'judge',
          content: 'JavaScript 是一种强类型语言。',
          answer: 'false',
          score: 10,
        },
        {
          id: 'q3',
          type: 'fill',
          content: '在 JavaScript 中，用于声明常量的关键字是______。',
          answer: 'const',
          score: 10,
        },
        {
          id: 'q4',
          type: 'choice',
          content: '以下哪个方法用于向数组末尾添加元素？',
          options: ['push()', 'pop()', 'shift()', 'unshift()'],
          answer: 'push()',
          score: 10,
        },
        {
          id: 'q5',
          type: 'judge',
          content: 'null 和 undefined 在 JavaScript 中是相同的值。',
          answer: 'false',
          score: 10,
        },
        {
          id: 'q6',
          type: 'fill',
          content: '用于将 JSON 字符串转换为 JavaScript 对象的方法是 JSON.______()。',
          answer: 'parse',
          score: 10,
        },
        {
          id: 'q7',
          type: 'choice',
          content: '以下哪个运算符用于严格相等比较？',
          options: ['==', '===', '=', '!='],
          answer: '===',
          score: 10,
        },
        {
          id: 'q8',
          type: 'judge',
          content: 'let 声明的变量具有块级作用域。',
          answer: 'true',
          score: 10,
        },
        {
          id: 'q9',
          type: 'fill',
          content: '箭头函数使用的符号是______。',
          answer: '=>',
          score: 10,
        },
        {
          id: 'q10',
          type: 'choice',
          content: '以下哪个不是循环语句？',
          options: ['for', 'while', 'forEach', 'if'],
          answer: 'if',
          score: 10,
        },
      ],
    },
    {
      id: 'quiz-2',
      title: 'React 核心概念测验',
      createdAt: '2026-06-18T14:30:00Z',
      questions: [
        {
          id: 'r1',
          type: 'choice',
          content: 'React 中用于管理组件状态的 Hook 是？',
          options: ['useEffect', 'useState', 'useContext', 'useRef'],
          answer: 'useState',
          score: 10,
        },
        {
          id: 'r2',
          type: 'judge',
          content: 'React 组件的状态可以直接修改。',
          answer: 'false',
          score: 10,
        },
        {
          id: 'r3',
          type: 'fill',
          content: 'React 中用于处理副作用的 Hook 是 use______。',
          answer: 'Effect',
          score: 10,
        },
        {
          id: 'r4',
          type: 'choice',
          content: '以下哪个不是 React 的生命周期阶段？',
          options: ['Mounting', 'Updating', 'Unmounting', 'Rendering'],
          answer: 'Rendering',
          score: 10,
        },
        {
          id: 'r5',
          type: 'judge',
          content: 'JSX 可以直接在浏览器中运行。',
          answer: 'false',
          score: 10,
        },
        {
          id: 'r6',
          type: 'fill',
          content: 'React 组件接收的只读数据参数称为______。',
          answer: 'props',
          score: 10,
        },
        {
          id: 'r7',
          type: 'choice',
          content: '在 React 中，key 属性的主要作用是？',
          options: [
            '设置样式',
            '帮助 React 识别列表中元素的变化',
            '传递数据',
            '触发事件',
          ],
          answer: '帮助 React 识别列表中元素的变化',
          score: 10,
        },
        {
          id: 'r8',
          type: 'judge',
          content: 'React 采用虚拟 DOM 来提高性能。',
          answer: 'true',
          score: 10,
        },
        {
          id: 'r9',
          type: 'fill',
          content: '用于在函数组件中访问 DOM 元素的 Hook 是 use______。',
          answer: 'Ref',
          score: 10,
        },
        {
          id: 'r10',
          type: 'choice',
          content: '以下哪个是 React Router 中用于导航的组件？',
          options: ['<Route>', '<Link>', '<Switch>', '<BrowserRouter>'],
          answer: '<Link>',
          score: 10,
        },
      ],
    },
  ];
}

function calculateMockScore(
  quizId: string,
  studentName: string,
  userAnswers: Answer[]
): Score {
  const quizzes = getMockQuizzes();
  const quiz = quizzes.find((q) => q.id === quizId);
  if (!quiz) {
    throw new Error('Quiz not found');
  }

  let totalScore = 0;
  let correctCount = 0;
  let totalTime = 0;

  const processedAnswers: Answer[] = userAnswers.map((ua) => {
    const question = quiz.questions.find((q) => q.id === ua.questionId);
    const isCorrect =
      question && question.answer.toLowerCase().trim() === ua.answer.toLowerCase().trim();
    if (isCorrect) {
      correctCount++;
      totalScore += question?.score || 0;
    }
    totalTime += ua.timeSpent;
    return { ...ua, isCorrect: !!isCorrect };
  });

  const questionStats = quiz.questions.map((q, index) => {
    const answer = processedAnswers.find((a) => a.questionId === q.id);
    return {
      questionId: q.id,
      questionIndex: index,
      accuracy: answer?.isCorrect ? 100 : 0,
      avgTimeSpent: answer?.timeSpent || 0,
    };
  });

  return {
    quizId,
    studentName,
    totalScore,
    correctCount,
    totalQuestions: quiz.questions.length,
    accuracy: Math.round((correctCount / quiz.questions.length) * 100),
    totalTime,
    answers: processedAnswers,
    questionStats,
    submittedAt: new Date().toISOString(),
  };
}

function getMockScores(): Score[] {
  return [
    {
      quizId: 'quiz-1',
      studentName: '张三',
      totalScore: 80,
      correctCount: 8,
      totalQuestions: 10,
      accuracy: 80,
      totalTime: 185,
      answers: [],
      questionStats: Array.from({ length: 10 }, (_, i) => ({
        questionId: `q${i + 1}`,
        questionIndex: i,
        accuracy: Math.random() * 100,
        avgTimeSpent: 10 + Math.random() * 30,
      })),
      submittedAt: '2026-06-19T09:30:00Z',
    },
    {
      quizId: 'quiz-1',
      studentName: '李四',
      totalScore: 90,
      correctCount: 9,
      totalQuestions: 10,
      accuracy: 90,
      totalTime: 150,
      answers: [],
      questionStats: Array.from({ length: 10 }, (_, i) => ({
        questionId: `q${i + 1}`,
        questionIndex: i,
        accuracy: Math.random() * 100,
        avgTimeSpent: 10 + Math.random() * 30,
      })),
      submittedAt: '2026-06-19T10:15:00Z',
    },
    {
      quizId: 'quiz-2',
      studentName: '王五',
      totalScore: 70,
      correctCount: 7,
      totalQuestions: 10,
      accuracy: 70,
      totalTime: 220,
      answers: [],
      questionStats: Array.from({ length: 10 }, (_, i) => ({
        questionId: `r${i + 1}`,
        questionIndex: i,
        accuracy: Math.random() * 100,
        avgTimeSpent: 10 + Math.random() * 30,
      })),
      submittedAt: '2026-06-19T11:00:00Z',
    },
  ];
}
