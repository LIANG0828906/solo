import axios from 'axios';
import type { Unit, Abilities, Subject, Level, QuizResult, QuizQuestion } from '@/types';

const api = axios.create({
  baseURL: '/api',
  timeout: 500,
  headers: {
    'Content-Type': 'application/json',
  },
});

const pathCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5000;

function getCached<T>(key: string): T | null {
  const entry = pathCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data as T;
  }
  pathCache.delete(key);
  return null;
}

function setCache(key: string, data: any) {
  pathCache.set(key, { data, timestamp: Date.now() });
}

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error);
    const message = error.response?.data?.detail || error.message || '请求失败';
    return Promise.reject(new Error(message));
  }
);

interface PathGenerateRequest {
  subject: string;
  level: string;
  abilities: Abilities;
}

interface PathAdjustRequest {
  subject: string;
  abilities: Abilities;
  currentUnits: Unit[];
}

interface QuizSubmitRequest {
  unitId: string;
  answers: Record<string, number>;
}

export async function generatePath(
  subject: Subject,
  level: Level,
  abilities: Abilities
): Promise<Unit[]> {
  const cacheKey = `gen-${subject}-${level}-${JSON.stringify(abilities)}`;
  const cached = getCached<{ units: Unit[] }>(cacheKey);
  if (cached) return cached.units;

  try {
    const data = await api.post<PathGenerateRequest, { units: Unit[] }>(
      '/path/generate',
      {
        subject,
        level,
        abilities,
      }
    );
    setCache(cacheKey, data);
    return data.units;
  } catch {
    return generateMockPath(subject, level, abilities);
  }
}

export async function adjustPath(
  subject: Subject,
  abilities: Abilities,
  currentUnits: Unit[]
): Promise<Unit[]> {
  const cacheKey = `adj-${subject}-${JSON.stringify(abilities)}-${currentUnits.map(u => u.id).join(',')}`;
  const cached = getCached<{ units: Unit[] }>(cacheKey);
  if (cached) return cached.units;

  try {
    const data = await api.post<PathAdjustRequest, { units: Unit[] }>(
      '/path/adjust',
      {
        subject,
        abilities,
        currentUnits,
      }
    );
    setCache(cacheKey, data);
    return data.units;
  } catch {
    return adjustMockPath(abilities, currentUnits);
  }
}

export async function submitQuiz(
  unitId: string,
  answers: Record<string, number>
): Promise<QuizResult> {
  try {
    const data = await api.post<QuizSubmitRequest, QuizResult>(
      '/quiz/submit',
      {
        unitId,
        answers,
      }
    );
    return data;
  } catch {
    return mockQuizSubmit(unitId, answers);
  }
}

function generateMockPath(
  subject: Subject,
  level: Level,
  abilities: Abilities
): Unit[] {
  const subjectUnits: Record<Subject, string[]> = {
    math: ['代数基础', '方程与不等式', '函数概念', '三角函数', '数列', '立体几何', '概率统计', '微积分入门'],
    english: ['基础词汇', '语法入门', '阅读理解', '听力训练', '写作技巧', '口语表达', '高级词汇', '商务英语'],
    physics: ['力学基础', '运动学', '牛顿定律', '能量守恒', '电磁学', '光学', '热学', '近代物理'],
    chemistry: ['原子结构', '化学键', '化学反应', '酸碱盐', '有机化学', '电化学', '化学平衡', '元素周期'],
  };

  const levelDifficulty: Record<Level, number> = {
    beginner: 1,
    elementary: 2,
    intermediate: 3,
    advanced: 4,
  };

  const avgAbility = Object.values(abilities).reduce((a, b) => a + b, 0) / 5;
  const baseDifficulty = levelDifficulty[level] + (avgAbility - 5) * 0.3;

  const unitTitles = subjectUnits[subject];
  const unitCount = Math.floor(Math.random() * 4) + 5;
  const selectedUnits = unitTitles.slice(0, unitCount);

  return selectedUnits.map((title, index) => {
    const difficulty = Math.min(5, Math.max(1, Math.round(baseDifficulty + index * 0.3)));
    return {
      id: `unit-${subject}-${index}`,
      title,
      description: `学习${title}的核心概念与应用，掌握相关解题技巧`,
      difficulty,
      order: index + 1,
      status: 'pending' as const,
      quiz: generateMockQuiz(title, difficulty, subject),
      estimatedTime: 15 + Math.floor(Math.random() * 15),
      isExpanded: false,
    };
  });
}

function generateMockQuiz(
  topic: string,
  difficulty: number,
  subject: Subject
): QuizQuestion[] {
  const questionCount = 3 + Math.floor(Math.random() * 3);
  const questions: QuizQuestion[] = [];

  for (let i = 0; i < questionCount; i++) {
    const baseOptions = [
      `选项A：${topic}的基础概念`,
      `选项B：${topic}的进阶应用`,
      `选项C：${topic}的常见误区`,
      `选项D：${topic}的综合运用`,
    ];

    const correctIndex = Math.floor(Math.random() * 4);

    questions.push({
      id: `q-${subject}-${topic}-${i}`,
      question: `【${difficulty}星难度】关于${topic}，以下哪个说法是正确的？`,
      options: baseOptions,
      correctAnswer: correctIndex,
      explanation: `正确答案是选项${String.fromCharCode(65 + correctIndex)}。因为${topic}的核心原理是基于基本概念的推导，需要理解其内在逻辑并能灵活应用到实际问题中。`,
    });
  }

  return questions;
}

function adjustMockPath(
  abilities: Abilities,
  currentUnits: Unit[]
): Unit[] {
  if (currentUnits.length === 0) return currentUnits;

  const avgAbility = Object.values(abilities).reduce((a, b) => a + b, 0) / 5;
  const abilityDiff = avgAbility - 5;

  const adjusted = currentUnits.map((unit, index) => {
    if (unit.status !== 'pending') return unit;

    let newDifficulty = unit.difficulty + abilityDiff * 0.4;
    newDifficulty = Math.min(5, Math.max(1, Math.round(newDifficulty)));

    return {
      ...unit,
      difficulty: newDifficulty,
      quiz: generateMockQuiz(unit.title, newDifficulty, 'math'),
    };
  });

  const pendingUnits = adjusted.filter((u) => u.status === 'pending');
  const doneUnits = adjusted.filter((u) => u.status !== 'pending');

  pendingUnits.sort((a, b) => a.difficulty - b.difficulty);

  const result: Unit[] = [];
  let order = 1;

  for (const unit of doneUnits) {
    result.push({ ...unit, order: order++ });
  }
  for (const unit of pendingUnits) {
    result.push({ ...unit, order: order++ });
  }

  return result.sort((a, b) => a.order - b.order);
}

function mockQuizSubmit(
  _unitId: string,
  answers: Record<string, number>
): QuizResult {
  const details: {
    questionId: string;
    isCorrect: boolean;
    userAnswer: number;
    correctAnswer: number;
    explanation: string;
  }[] = [];

  let correctCount = 0;
  const questionIds = Object.keys(answers);

  for (const qId of questionIds) {
    const correct = Math.random() > 0.4;
    if (correct) correctCount++;

    details.push({
      questionId: qId,
      isCorrect: correct,
      userAnswer: answers[qId],
      correctAnswer: correct ? answers[qId] : (answers[qId] + 1) % 4,
      explanation: '这道题考查的是对基本概念的理解。正确选项符合题目描述的核心原理，其他选项存在常见错误或理解偏差。',
    });
  }

  const totalCount = questionIds.length || 4;
  const score = Math.round((correctCount / totalCount) * 100);

  return {
    score,
    correctCount,
    totalCount,
    details,
    timeSpent: 10 + Math.floor(Math.random() * 15),
  };
}
