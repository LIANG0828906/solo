import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import type { ReadingRecord, BookRecommendation } from '../types';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

let records: ReadingRecord[] = [
  {
    id: uuidv4(),
    childName: '小明',
    bookName: '好饿的毛毛虫',
    date: '2026-06-01',
    tags: ['自然', '成长', '昆虫'],
    rating: 5,
  },
  {
    id: uuidv4(),
    childName: '小明',
    bookName: '猜猜我有多爱你',
    date: '2026-06-05',
    tags: ['亲情', '温馨', '动物'],
    rating: 5,
  },
];

const allBooksPool: Omit<BookRecommendation, 'matchedTags' | 'matchScore' | 'reason'>[] = [
  {
    id: 'b1',
    title: '好饿的毛毛虫',
    cover: '🐛',
    description: '讲述了一只毛毛虫从孵化到变成美丽蝴蝶的成长历程，带领孩子认识星期、数字和水果。',
    author: '艾瑞·卡尔',
    ageRange: '0-3岁',
  },
  {
    id: 'b2',
    title: '猜猜我有多爱你',
    cover: '🐰',
    description: '小兔子和大兔子用各种方式表达对彼此的爱，让孩子感受到亲情的温暖与伟大。',
    author: '山姆·麦克布雷尼',
    ageRange: '2-5岁',
  },
  {
    id: 'b3',
    title: '恐龙大陆',
    cover: '🦕',
    description: '跟随勇敢的三角龙大角，穿越危险的恐龙大陆，体验惊心动魄的冒险旅程。',
    author: '黑川光广',
    ageRange: '3-6岁',
  },
  {
    id: 'b4',
    title: '白雪公主',
    cover: '👸',
    description: '经典童话改编，讲述美丽善良的白雪公主与七个小矮人一起对抗邪恶皇后的故事。',
    author: '格林兄弟',
    ageRange: '3-7岁',
  },
  {
    id: 'b5',
    title: '海底小纵队',
    cover: '🐙',
    description: '和巴克队长一起探索神秘的海底世界，认识各种海洋生物，学习勇敢与协作。',
    author: '英国Silvergate',
    ageRange: '3-6岁',
  },
  {
    id: 'b6',
    title: '神奇校车',
    cover: '🚍',
    description: '跟随卷毛老师驾驶神奇校车，深入人体内部，开启奇妙的科学探索之旅。',
    author: '乔安娜·柯尔',
    ageRange: '4-8岁',
  },
  {
    id: 'b7',
    title: '彼得兔的故事',
    cover: '🐇',
    description: '调皮的彼得兔偷偷溜进麦克格雷戈先生的菜园，展开一场有趣又惊险的冒险。',
    author: '毕翠克丝·波特',
    ageRange: '2-5岁',
  },
  {
    id: 'b8',
    title: '我爸爸',
    cover: '👨',
    description: '通过孩子的视角，描绘出一个无所不能、充满爱与温暖的爸爸形象。',
    author: '安东尼·布朗',
    ageRange: '2-6岁',
  },
];

const bookTagMap: Record<string, string[]> = {
  b1: ['自然', '成长', '昆虫', '启蒙', '数字'],
  b2: ['亲情', '温馨', '动物', '爱', '睡前故事'],
  b3: ['恐龙', '冒险', '勇敢', '自然', '科普'],
  b4: ['公主', '童话', '冒险', '友谊', '善良'],
  b5: ['冒险', '海洋', '动物', '科普', '友谊'],
  b6: ['科普', '冒险', '神奇', '人体', '科学'],
  b7: ['动物', '冒险', '自然', '温馨', '勇气'],
  b8: ['亲情', '温馨', '父爱', '家庭', '成长'],
};

app.get('/api/recommendations', (req, res) => {
  const userTags = new Set<string>();
  records.forEach((r) => r.tags.forEach((t) => userTags.add(t)));

  const recommendations: BookRecommendation[] = allBooksPool.map((book) => {
    const bookTags = bookTagMap[book.id] || [];
    const matched = bookTags.filter((t) => userTags.has(t));
    const score = userTags.size > 0 ? Math.round((matched.length / bookTags.length) * 100) : 30;
    const finalScore = Math.max(score + Math.floor(Math.random() * 20), 20);
    const reason =
      matched.length > 0
        ? `根据孩子喜欢的「${matched.slice(0, 3).join('」「')}」主题推荐`
        : '精选优质绘本，适合亲子共读';
    return {
      ...book,
      matchedTags: matched,
      matchScore: Math.min(finalScore, 100),
      reason,
    };
  });

  recommendations.sort((a, b) => b.matchScore - a.matchScore);
  res.json(recommendations.slice(0, 8));
});

app.get('/api/records', (req, res) => {
  res.json(records);
});

app.post('/api/records', (req, res) => {
  const { childName, bookName, date, tags, rating } = req.body;
  if (!childName || !bookName || !date || !tags || rating === undefined) {
    res.status(400).json({ error: '缺少必填字段' });
    return;
  }
  const newRecord: ReadingRecord = {
    id: uuidv4(),
    childName,
    bookName,
    date,
    tags,
    rating,
  };
  records.unshift(newRecord);
  res.status(201).json(newRecord);
});

app.listen(PORT, () => {
  console.log(`绘本推荐后端服务运行在 http://localhost:${PORT}`);
});
