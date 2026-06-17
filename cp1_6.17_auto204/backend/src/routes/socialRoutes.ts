import { Router, Request, Response } from 'express';

const router = Router();

interface FeedItem {
  id: string;
  userId: string;
  userName: string;
  bookTitle: string;
  review: string;
  category: string;
  timestamp: string;
}

const mockFeed: FeedItem[] = [
  {
    id: '1',
    userId: 'user_001',
    userName: '李明',
    bookTitle: '百年孤独',
    review: '马尔克斯的文字真的太美了，布恩迪亚家族的故事让人沉浸其中无法自拔。',
    category: '小说',
    timestamp: '2026-06-16T10:30:00Z',
  },
  {
    id: '2',
    userId: 'user_002',
    userName: '王芳',
    bookTitle: '时间简史',
    review: '霍金太厉害了，用这么通俗易懂的语言讲清楚了宇宙的奥秘。虽然黑洞部分还是有点晕～',
    category: '科普',
    timestamp: '2026-06-16T09:15:00Z',
  },
  {
    id: '3',
    userId: 'user_003',
    userName: '张伟',
    bookTitle: '万历十五年',
    review: '黄仁宇先生的大历史观让人耳目一新，从一个年份看透整个明朝的制度困境。',
    category: '历史',
    timestamp: '2026-06-15T20:45:00Z',
  },
  {
    id: '4',
    userId: 'user_004',
    userName: '刘洋',
    bookTitle: '活着',
    review: '余华笔下的福贵经历了太多苦难，但依然坚强地活着。看完哭了好久...',
    category: '小说',
    timestamp: '2026-06-15T15:20:00Z',
  },
  {
    id: '5',
    userId: 'user_005',
    userName: '陈思',
    bookTitle: '苏菲的世界',
    review: '原来哲学可以这么有趣！跟着苏菲一起思考"我是谁"这个终极问题。',
    category: '哲学',
    timestamp: '2026-06-14T18:00:00Z',
  },
];

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

router.get('/social/feed', (_req: Request, res: Response) => {
  const shuffled = shuffleArray(mockFeed);
  res.json(shuffled);
});

export default router;
