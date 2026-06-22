import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FEEDBACK_FILE = path.join(__dirname, '../../data/feedback.json');
const ACTIONS_FILE = path.join(__dirname, '../../data/actions.json');

interface Sentiment {
  positive: number;
  negative: number;
  neutral: number;
}

export interface Feedback {
  id: string;
  good: string;
  bad: string;
  improve: string;
  sentiment: Sentiment;
  iteration: number;
  createdAt: string;
}

export interface ActionItem {
  id: string;
  description: string;
  assignee: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  completed: boolean;
  createdAt: string;
}

export interface EmotionTrendPoint {
  iteration: number;
  date: string;
  positive: number;
  negative: number;
  neutral: number;
}

function readJSON<T>(filePath: string): T[] {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeJSON<T>(filePath: string, data: T[]): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

const positiveWords = [
  '好', '优秀', '出色', '顺利', '高效', '开心', '满意', '成功', '完美', '棒',
  '赞', '提升', '进步', '快速', '清晰', '合理', '稳定', '可靠', '良好', '高',
  'great', 'good', 'excellent', 'well', 'happy', 'love', 'awesome', 'amazing',
  'perfect', 'improve', 'success', 'better', 'best', 'nice', 'wonderful',
];

const negativeWords = [
  '差', '糟糕', '失败', '困难', '慢', '问题', '不满', '错误', '延期', '混乱',
  '缺失', '不足', '返工', '阻塞', '缺陷', '遗漏', '低效', '严重', '风险', '难',
  'bad', 'poor', 'terrible', 'slow', 'difficult', 'hate', 'wrong', 'fail',
  'issue', 'block', 'delay', 'miss', 'bug', 'error', 'crash', 'fault',
];

function analyzeSentiment(good: string, bad: string, improve: string): Sentiment {
  let posCount = 0;
  let negCount = 0;

  for (const word of positiveWords) {
    const re = new RegExp(word, 'gi');
    const m = good.match(re);
    if (m) posCount += m.length * 2;
  }
  for (const word of negativeWords) {
    const re = new RegExp(word, 'gi');
    const m = bad.match(re);
    if (m) negCount += m.length * 2;
  }

  const fullText = `${good} ${bad} ${improve}`;
  for (const word of positiveWords) {
    const re = new RegExp(word, 'gi');
    const m = fullText.match(re);
    if (m) posCount += m.length;
  }
  for (const word of negativeWords) {
    const re = new RegExp(word, 'gi');
    const m = fullText.match(re);
    if (m) negCount += m.length;
  }

  const total = Math.max(posCount + negCount, 1);
  const positive = Math.round((posCount / total) * 100);
  const negative = Math.round((negCount / total) * 100);
  const neutral = Math.max(0, 100 - positive - negative);

  return { positive, negative, neutral };
}

function getCurrentIteration(): number {
  const feedbacks = readJSON<Feedback>(FEEDBACK_FILE);
  if (feedbacks.length === 0) return 1;
  const maxIteration = Math.max(...feedbacks.map((f) => f.iteration));
  const latestFeedbacks = feedbacks.filter((f) => f.iteration === maxIteration);
  const latestDate = new Date(
    latestFeedbacks[latestFeedbacks.length - 1].createdAt,
  );
  const now = new Date();
  const diffDays =
    (now.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays > 14 ? maxIteration + 1 : maxIteration;
}

export function addFeedback(
  good: string,
  bad: string,
  improve: string,
): Feedback {
  const feedbacks = readJSON<Feedback>(FEEDBACK_FILE);
  const sentiment = analyzeSentiment(good, bad, improve);
  const iteration = getCurrentIteration();

  const feedback: Feedback = {
    id: uuidv4(),
    good,
    bad,
    improve,
    sentiment,
    iteration,
    createdAt: new Date().toISOString(),
  };

  feedbacks.push(feedback);
  writeJSON(FEEDBACK_FILE, feedbacks);

  if (improve.trim()) {
    const actions = readJSON<ActionItem>(ACTIONS_FILE);
    actions.push({
      id: uuidv4(),
      description: improve.substring(0, 100),
      assignee: '',
      priority: 'medium',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      completed: false,
      createdAt: new Date().toISOString(),
    });
    writeJSON(ACTIONS_FILE, actions);
  }

  return feedback;
}

export function getAllFeedbacks(): Feedback[] {
  return readJSON<Feedback>(FEEDBACK_FILE).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getEmotionTrend(): EmotionTrendPoint[] {
  const feedbacks = readJSON<Feedback>(FEEDBACK_FILE);
  const iterationMap = new Map<number, Feedback[]>();

  for (const f of feedbacks) {
    if (!iterationMap.has(f.iteration)) {
      iterationMap.set(f.iteration, []);
    }
    iterationMap.get(f.iteration)!.push(f);
  }

  const trend: EmotionTrendPoint[] = [];
  const iterations = Array.from(iterationMap.keys()).sort((a, b) => a - b);
  const lastFour = iterations.slice(-4);

  for (const iter of lastFour) {
    const items = iterationMap.get(iter)!;
    const avgPositive = Math.round(
      items.reduce((sum, f) => sum + f.sentiment.positive, 0) / items.length,
    );
    const avgNegative = Math.round(
      items.reduce((sum, f) => sum + f.sentiment.negative, 0) / items.length,
    );
    const avgNeutral = Math.round(
      items.reduce((sum, f) => sum + f.sentiment.neutral, 0) / items.length,
    );

    const date = items[0].createdAt.split('T')[0];

    trend.push({
      iteration: iter,
      date,
      positive: avgPositive,
      negative: avgNegative,
      neutral: avgNeutral,
    });
  }

  return trend;
}

export function getAllActions(): ActionItem[] {
  return readJSON<ActionItem>(ACTIONS_FILE).sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return (
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  });
}

export function updateAction(
  id: string,
  updates: Partial<ActionItem>,
): ActionItem | null {
  const actions = readJSON<ActionItem>(ACTIONS_FILE);
  const index = actions.findIndex((a) => a.id === id);
  if (index === -1) return null;

  actions[index] = { ...actions[index], ...updates, id: actions[index].id };
  writeJSON(ACTIONS_FILE, actions);
  return actions[index];
}

export function addAction(
  item: Omit<ActionItem, 'id' | 'createdAt'>,
): ActionItem {
  const actions = readJSON<ActionItem>(ACTIONS_FILE);
  const action: ActionItem = {
    id: uuidv4(),
    ...item,
    createdAt: new Date().toISOString(),
  };
  actions.push(action);
  writeJSON(ACTIONS_FILE, actions);
  return action;
}
