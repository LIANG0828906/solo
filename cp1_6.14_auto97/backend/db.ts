import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import type { Course, Question, Paper, PaperSubmission, GradingResult } from '../shared/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Data {
  courses: Course[];
  questions: Question[];
  papers: Paper[];
  submissions: PaperSubmission[];
  gradingResults: GradingResult[];
}

const chapterId = uuidv4();
const question1Id = uuidv4();
const question2Id = uuidv4();
const question3Id = uuidv4();

const defaultData: Data = {
  courses: [
    {
      id: uuidv4(),
      name: '初中数学',
      createdAt: new Date().toISOString(),
      chapters: [
        {
          id: chapterId,
          name: '一元二次方程',
          knowledgePoints: ['求根公式', '判别式', '因式分解法'],
        },
      ],
    },
  ],
  questions: [
    {
      id: question1Id,
      chapterId,
      type: 'single',
      difficulty: 'basic',
      content: '方程 $x^2 - 5x + 6 = 0$ 的解是？',
      knowledgePoint: '因式分解法',
      score: 5,
      options: [
        { key: 'A', content: '$x_1 = 2, x_2 = 3$' },
        { key: 'B', content: '$x_1 = -2, x_2 = -3$' },
        { key: 'C', content: '$x_1 = 1, x_2 = 6$' },
        { key: 'D', content: '$x_1 = -1, x_2 = -6$' },
      ],
      correctAnswer: ['A'],
      explanation: '使用因式分解：$(x-2)(x-3)=0$，所以 $x=2$ 或 $x=3$',
      createdAt: new Date().toISOString(),
    },
    {
      id: question2Id,
      chapterId,
      type: 'multiple',
      difficulty: 'medium',
      content: '下列方程中，是一元二次方程的有？',
      knowledgePoint: '判别式',
      score: 10,
      options: [
        { key: 'A', content: '$x^2 + 2x + 1 = 0$' },
        { key: 'B', content: '$2x + 3 = 0$' },
        { key: 'C', content: '$x^2 - 4 = 0$' },
        { key: 'D', content: '$x^3 + x = 0$' },
      ],
      correctAnswer: ['A', 'C'],
      explanation: '一元二次方程的最高次数为2，A和C符合条件',
      createdAt: new Date().toISOString(),
    },
    {
      id: question3Id,
      chapterId,
      type: 'fill',
      difficulty: 'hard',
      content: '方程 $x^2 + 2x - 3 = 0$ 的求根公式为 $x = $ ______',
      knowledgePoint: '求根公式',
      score: 10,
      fillAnswers: [
        { answer: '(-2±4)/2', mode: 'fuzzy' },
        { answer: '-1±2', mode: 'fuzzy' },
        { answer: '1或-3', mode: 'fuzzy' },
      ],
      explanation: '由求根公式 $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$，代入a=1, b=2, c=-3 可得',
      createdAt: new Date().toISOString(),
    },
  ],
  papers: [
    {
      id: uuidv4(),
      title: '一元二次方程基础练习',
      chapterId,
      questionIds: [question1Id, question2Id, question3Id],
      totalScore: 25,
      createdAt: new Date().toISOString(),
    },
  ],
  submissions: [],
  gradingResults: [],
};

let db: Low<Data> | null = null;

export async function getDb(): Promise<Low<Data>> {
  if (!db) {
    const file = path.join(__dirname, 'db.json');
    const adapter = new JSONFile<Data>(file);
    db = new Low(adapter, defaultData);
    await db.read();
    if (!db.data) {
      db.data = defaultData;
      await db.write();
    }
    if (!db.data.courses) db.data.courses = defaultData.courses;
    if (!db.data.questions) db.data.questions = defaultData.questions;
    if (!db.data.papers) db.data.papers = defaultData.papers;
    if (!db.data.submissions) db.data.submissions = defaultData.submissions;
    if (!db.data.gradingResults) db.data.gradingResults = defaultData.gradingResults;
  }
  return db;
}
