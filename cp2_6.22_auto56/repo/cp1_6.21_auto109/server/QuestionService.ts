import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { Question, CreateQuestionPayload } from '../src/types';

const questions: Question[] = [
  {
    id: uuidv4(),
    type: 'choice',
    text: 'React 中用于管理组件状态的 Hook 是？',
    options: ['useEffect', 'useState', 'useContext', 'useRef'],
    correctAnswer: 'B',
    knowledgePoints: ['React Hooks', '状态管理'],
  },
  {
    id: uuidv4(),
    type: 'choice',
    text: '以下哪个不是 JavaScript 的基本数据类型？',
    options: ['string', 'number', 'array', 'boolean'],
    correctAnswer: 'C',
    knowledgePoints: ['JavaScript基础', '数据类型'],
  },
  {
    id: uuidv4(),
    type: 'choice',
    text: 'CSS 中实现 flex 布局的属性是？',
    options: ['display: block', 'display: flex', 'display: grid', 'display: inline'],
    correctAnswer: 'B',
    knowledgePoints: ['CSS布局', 'Flexbox'],
  },
  {
    id: uuidv4(),
    type: 'judge',
    text: 'TypeScript 是 JavaScript 的超集，支持静态类型检查。',
    correctAnswer: 'true',
    knowledgePoints: ['TypeScript', '类型系统'],
  },
  {
    id: uuidv4(),
    type: 'judge',
    text: 'React 组件的 state 可以直接修改，不需要调用 setState。',
    correctAnswer: 'false',
    knowledgePoints: ['React Hooks', '状态管理'],
  },
  {
    id: uuidv4(),
    type: 'choice',
    text: 'HTTP 状态码 404 表示？',
    options: ['服务器错误', '资源未找到', '请求成功', '重定向'],
    correctAnswer: 'B',
    knowledgePoints: ['HTTP协议', '网络基础'],
  },
  {
    id: uuidv4(),
    type: 'choice',
    text: 'Node.js 使用的 JavaScript 引擎是？',
    options: ['SpiderMonkey', 'V8', 'JavaScriptCore', 'Chakra'],
    correctAnswer: 'B',
    knowledgePoints: ['Node.js', '运行环境'],
  },
  {
    id: uuidv4(),
    type: 'judge',
    text: 'Promise 的 then 方法总是返回一个新的 Promise。',
    correctAnswer: 'true',
    knowledgePoints: ['JavaScript异步', 'Promise'],
  },
  {
    id: uuidv4(),
    type: 'choice',
    text: 'Git 中用于查看提交历史的命令是？',
    options: ['git status', 'git log', 'git diff', 'git show'],
    correctAnswer: 'B',
    knowledgePoints: ['Git', '版本控制'],
  },
  {
    id: uuidv4(),
    type: 'judge',
    text: 'HTML 中的 <script> 标签必须放在 <body> 的末尾才能执行。',
    correctAnswer: 'false',
    knowledgePoints: ['HTML基础', 'DOM'],
  },
];

export const questionRouter = Router();

questionRouter.get('/', (_req: Request, res: Response<Question[]>) => {
  res.json(questions);
});

questionRouter.post('/', (req: Request<never, never, CreateQuestionPayload>, res: Response<Question>) => {
  const { type, text, options, correctAnswer, knowledgePoints } = req.body;

  if (!type || !text || !correctAnswer || !knowledgePoints) {
    res.status(400).json({} as Question);
    return;
  }

  if (type === 'choice' && (!options || options.length < 2)) {
    res.status(400).json({} as Question);
    return;
  }

  const newQuestion: Question = {
    id: uuidv4(),
    type,
    text,
    options: type === 'choice' ? options : undefined,
    correctAnswer,
    knowledgePoints,
  };

  questions.push(newQuestion);
  res.status(201).json(newQuestion);
});

export function getQuestions(): Question[] {
  return questions;
}

export function findQuestionById(id: string): Question | undefined {
  return questions.find((q) => q.id === id);
}

export function sampleQuestions(count: number): Question[] {
  const choices = questions.filter((q) => q.type === 'choice');
  const judges = questions.filter((q) => q.type === 'judge');

  const choiceCount = Math.min(Math.ceil(count * 0.6), choices.length);
  const judgeCount = Math.min(count - choiceCount, judges.length);

  const shuffledChoices = [...choices].sort(() => Math.random() - 0.5).slice(0, choiceCount);
  const shuffledJudges = [...judges].sort(() => Math.random() - 0.5).slice(0, judgeCount);

  const result = [...shuffledChoices, ...shuffledJudges];
  while (result.length < count && questions.length > result.length) {
    const remaining = questions.filter((q) => !result.find((r) => r.id === q.id));
    if (remaining.length === 0) break;
    result.push(remaining[Math.floor(Math.random() * remaining.length)]);
  }

  return result.sort(() => Math.random() - 0.5);
}
