import { create } from 'zustand';
import type { Poem, Annotation, PoemStats, EmotionType } from '../types';

interface PoemStore {
  poems: Poem[];
  currentPoemId: string | null;
  annotations: Annotation[];
  stats: Record<string, PoemStats>;
  addPoem: (poem: Omit<Poem, 'id' | 'createdAt' | 'views'>) => void;
  getPoem: (id: string) => Poem | undefined;
  incrementView: (poemId: string) => void;
  addAnnotation: (annotation: Omit<Annotation, 'id' | 'createdAt'>) => void;
  getAnnotationsByPoem: (poemId: string) => Annotation[];
  calculateStats: (poemId: string) => PoemStats;
}

const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

const initialPoems: Poem[] = [
  {
    id: 'poem-1',
    title: '静夜思',
    author: '李白',
    content: `床前明月光，
疑是地上霜。
举头望明月，
低头思故乡。`,
    createdAt: '2024-01-15T10:30:00Z',
    views: 1256,
  },
  {
    id: 'poem-2',
    title: '春晓',
    author: '孟浩然',
    content: `春眠不觉晓，
处处闻啼鸟。
夜来风雨声，
花落知多少。`,
    createdAt: '2024-01-20T14:20:00Z',
    views: 892,
  },
  {
    id: 'poem-3',
    title: '登鹳雀楼',
    author: '王之涣',
    content: `白日依山尽，
黄河入海流。
欲穷千里目，
更上一层楼。`,
    createdAt: '2024-02-01T09:15:00Z',
    views: 2103,
  },
];

const initialAnnotations: Annotation[] = [
  { id: 'ann-1', poemId: 'poem-1', lineNumber: 1, content: '月光如银，洒落床前，开篇即营造出宁静的氛围。', emotion: 'calm', author: '诗评家A', createdAt: '2024-01-16T08:00:00Z' },
  { id: 'ann-2', poemId: 'poem-1', lineNumber: 2, content: '疑是霜，生动地写出了月光的皎洁清冷。', emotion: 'calm', author: '文学爱好者B', createdAt: '2024-01-16T10:30:00Z' },
  { id: 'ann-3', poemId: 'poem-1', lineNumber: 3, content: '举头望月，动作与情感自然过渡。', emotion: 'calm', author: '读者C', createdAt: '2024-01-17T14:20:00Z' },
  { id: 'ann-4', poemId: 'poem-1', lineNumber: 4, content: '点睛之笔，思乡之情油然而生，感人至深。', emotion: 'sorrow', author: '诗评家A', createdAt: '2024-01-17T16:45:00Z' },
  { id: 'ann-5', poemId: 'poem-1', lineNumber: 4, content: '短短二十字，道尽游子心声。', emotion: 'sorrow', author: '留学生D', createdAt: '2024-01-18T09:00:00Z' },
  { id: 'ann-6', poemId: 'poem-1', lineNumber: 1, content: '简单的意象，深远的意境。', emotion: 'joy', author: '教师E', createdAt: '2024-01-18T11:30:00Z' },
  { id: 'ann-7', poemId: 'poem-1', lineNumber: 2, content: '一个"疑"字，把诗人的恍惚神态写活了。', emotion: 'passion', author: '文学爱好者B', createdAt: '2024-01-19T13:15:00Z' },

  { id: 'ann-8', poemId: 'poem-2', lineNumber: 1, content: '春眠之惬意，开篇即显。', emotion: 'joy', author: '读者C', createdAt: '2024-01-21T08:30:00Z' },
  { id: 'ann-9', poemId: 'poem-2', lineNumber: 2, content: '鸟鸣声声，生机盎然。', emotion: 'joy', author: '诗评家A', createdAt: '2024-01-21T10:00:00Z' },
  { id: 'ann-10', poemId: 'poem-2', lineNumber: 3, content: '风雨声，诗人的听觉记忆。', emotion: 'calm', author: '文学爱好者B', createdAt: '2024-01-22T14:45:00Z' },
  { id: 'ann-11', poemId: 'poem-2', lineNumber: 4, content: '对落花的惋惜，对春光的眷恋。', emotion: 'sorrow', author: '教师E', createdAt: '2024-01-22T16:30:00Z' },
  { id: 'ann-12', poemId: 'poem-2', lineNumber: 4, content: '知多少，一个问句，言有尽而意无穷。', emotion: 'passion', author: '读者C', createdAt: '2024-01-23T09:20:00Z' },
  { id: 'ann-13', poemId: 'poem-2', lineNumber: 1, content: '不觉晓，睡得真香啊！', emotion: 'joy', author: '学生F', createdAt: '2024-01-23T11:10:00Z' },

  { id: 'ann-14', poemId: 'poem-3', lineNumber: 1, content: '白日西沉，壮阔的自然景象。', emotion: 'calm', author: '诗评家A', createdAt: '2024-02-02T10:00:00Z' },
  { id: 'ann-15', poemId: 'poem-3', lineNumber: 2, content: '黄河奔涌，气势磅礴。', emotion: 'passion', author: '文学爱好者B', createdAt: '2024-02-02T12:30:00Z' },
  { id: 'ann-16', poemId: 'poem-3', lineNumber: 3, content: '欲穷千里，体现诗人的远大胸襟。', emotion: 'passion', author: '读者C', createdAt: '2024-02-03T09:45:00Z' },
  { id: 'ann-17', poemId: 'poem-3', lineNumber: 4, content: '更上一层楼，千古名句，激励人心。', emotion: 'passion', author: '教师E', createdAt: '2024-02-03T14:20:00Z' },
  { id: 'ann-18', poemId: 'poem-3', lineNumber: 4, content: '积极向上的人生态度。', emotion: 'joy', author: '学生F', createdAt: '2024-02-04T08:30:00Z' },
  { id: 'ann-19', poemId: 'poem-3', lineNumber: 2, content: '一"依"一"入"，动静结合。', emotion: 'calm', author: '诗评家A', createdAt: '2024-02-04T11:00:00Z' },
  { id: 'ann-20', poemId: 'poem-3', lineNumber: 3, content: '由景入情，自然过渡。', emotion: 'joy', author: '文学爱好者B', createdAt: '2024-02-05T13:30:00Z' },
  { id: 'ann-21', poemId: 'poem-3', lineNumber: 4, content: '人生的境界，莫过于此。', emotion: 'passion', author: '读者C', createdAt: '2024-02-05T15:45:00Z' },
];

export const usePoemStore = create<PoemStore>((set, get) => ({
  poems: initialPoems,
  currentPoemId: null,
  annotations: initialAnnotations,
  stats: {},

  addPoem: (poem) => {
    const newPoem: Poem = {
      ...poem,
      id: generateId(),
      createdAt: new Date().toISOString(),
      views: 0,
    };
    set((state) => ({
      poems: [...state.poems, newPoem],
    }));
  },

  getPoem: (id) => {
    return get().poems.find((poem) => poem.id === id);
  },

  incrementView: (poemId) => {
    set((state) => ({
      poems: state.poems.map((poem) =>
        poem.id === poemId ? { ...poem, views: poem.views + 1 } : poem
      ),
    }));
  },

  addAnnotation: (annotation) => {
    const newAnnotation: Annotation = {
      ...annotation,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      annotations: [...state.annotations, newAnnotation],
    }));
  },

  getAnnotationsByPoem: (poemId) => {
    return get().annotations.filter((ann) => ann.poemId === poemId);
  },

  calculateStats: (poemId) => {
    const state = get();
    const poem = state.poems.find((p) => p.id === poemId);
    const poemAnnotations = state.annotations.filter((ann) => ann.poemId === poemId);

    const viewTrend: { date: string; views: number }[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const baseViews = poem ? Math.floor(poem.views / 7) : 0;
      const variance = Math.floor(Math.random() * 50) - 25;
      viewTrend.push({
        date: dateStr,
        views: Math.max(0, baseViews + variance),
      });
    }

    const lineCount: Record<number, number> = {};
    poemAnnotations.forEach((ann) => {
      lineCount[ann.lineNumber] = (lineCount[ann.lineNumber] || 0) + 1;
    });
    const annotationHeat = Object.entries(lineCount)
      .map(([line, count]) => ({ line: parseInt(line), count }))
      .sort((a, b) => a.line - b.line);

    const emotionCount: Record<EmotionType, number> = {
      joy: 0,
      sorrow: 0,
      passion: 0,
      calm: 0,
      anger: 0,
    };
    poemAnnotations.forEach((ann) => {
      emotionCount[ann.emotion]++;
    });
    const total = poemAnnotations.length || 1;
    const emotionDistribution = (Object.keys(emotionCount) as EmotionType[]).map(
      (emotion) => ({
        emotion,
        count: emotionCount[emotion],
        percentage: Math.round((emotionCount[emotion] / total) * 100),
      })
    );

    const stats: PoemStats = {
      viewTrend,
      annotationHeat,
      emotionDistribution,
    };

    set((state) => ({
      stats: {
        ...state.stats,
        [poemId]: stats,
      },
    }));

    return stats;
  },
}));
