import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

interface User {
  id: string;
  username: string;
  avatarColor: string;
  createdAt: Date;
}

interface Book {
  id: string;
  title: string;
  author: string;
  tags: string[];
}

interface Box {
  id: string;
  bookId: string;
  userId: string;
  username: string;
  avatarColor: string;
  feeling: string;
  createdAt: Date;
}

interface Fishing {
  id: string;
  userId: string;
  boxId: string;
  bookId: string;
  feeling: string;
  tags: string[];
  createdAt: Date;
}

interface Recommendation {
  bookId: string;
  title: string;
  author: string;
  tags: string[];
  matchScore: number;
}

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const users: User[] = [];
const boxes: Box[] = [];
const fishings: Fishing[] = [];

const PREDEFINED_TAGS: string[] = [
  '治愈', '悬疑', '爱情', '成长', '哲学',
  '科幻', '历史', '诗歌', '冒险', '温暖',
  '推理', '青春', '人生', '孤独', '希望',
  '勇气', '梦想', '自由', '亲情', '智慧'
];

const BOOK_DATABASE: Omit<Book, 'id'>[] = [
  { title: '活着', author: '余华', tags: ['人生', '成长', '希望'] },
  { title: '百年孤独', author: '加西亚·马尔克斯', tags: ['历史', '孤独', '哲学'] },
  { title: '三体', author: '刘慈欣', tags: ['科幻', '冒险', '智慧'] },
  { title: '小王子', author: '圣埃克苏佩里', tags: ['治愈', '温暖', '成长'] },
  { title: '围城', author: '钱钟书', tags: ['人生', '智慧', '爱情'] },
  { title: '解忧杂货店', author: '东野圭吾', tags: ['治愈', '温暖', '希望'] },
  { title: '白夜行', author: '东野圭吾', tags: ['悬疑', '推理', '爱情'] },
  { title: '平凡的世界', author: '路遥', tags: ['成长', '人生', '希望'] },
  { title: '红楼梦', author: '曹雪芹', tags: ['历史', '爱情', '诗歌'] },
  { title: '挪威的森林', author: '村上春树', tags: ['青春', '爱情', '孤独'] },
  { title: '追风筝的人', author: '卡勒德·胡赛尼', tags: ['成长', '勇气', '亲情'] },
  { title: '不能承受的生命之轻', author: '米兰·昆德拉', tags: ['哲学', '人生', '爱情'] },
  { title: '人间失格', author: '太宰治', tags: ['孤独', '人生', '成长'] },
  { title: '月亮与六便士', author: '毛姆', tags: ['梦想', '自由', '人生'] },
  { title: '局外人', author: '加缪', tags: ['哲学', '孤独', '人生'] },
  { title: '嫌疑人X的献身', author: '东野圭吾', tags: ['悬疑', '推理', '爱情'] },
  { title: '活着', author: '余华', tags: ['人生', '成长', '希望'] },
  { title: '边城', author: '沈从文', tags: ['温暖', '治愈', '亲情'] },
  { title: '呐喊', author: '鲁迅', tags: ['历史', '智慧', '勇气'] },
  { title: '朝花夕拾', author: '鲁迅', tags: ['成长', '亲情', '温暖'] },
  { title: '骆驼祥子', author: '老舍', tags: ['历史', '人生', '希望'] },
  { title: '茶馆', author: '老舍', tags: ['历史', '人生', '智慧'] },
  { title: '家', author: '巴金', tags: ['成长', '自由', '亲情'] },
  { title: '春', author: '巴金', tags: ['成长', '自由', '希望'] },
  { title: '秋', author: '巴金', tags: ['成长', '人生', '智慧'] },
  { title: '雨巷', author: '戴望舒', tags: ['诗歌', '爱情', '孤独'] },
  { title: '再别康桥', author: '徐志摩', tags: ['诗歌', '自由', '温暖'] },
  { title: '繁星·春水', author: '冰心', tags: ['诗歌', '亲情', '治愈'] },
  { title: '城南旧事', author: '林海音', tags: ['成长', '亲情', '温暖'] },
  { title: '撒哈拉的故事', author: '三毛', tags: ['冒险', '自由', '爱情'] },
  { title: '雨季不再来', author: '三毛', tags: ['成长', '青春', '爱情'] },
  { title: '梦里花落知多少', author: '三毛', tags: ['爱情', '亲情', '人生'] },
  { title: '草房子', author: '曹文轩', tags: ['成长', '温暖', '亲情'] },
  { title: '青铜葵花', author: '曹文轩', tags: ['成长', '亲情', '希望'] },
  { title: '根鸟', author: '曹文轩', tags: ['成长', '冒险', '梦想'] },
  { title: '细米', author: '曹文轩', tags: ['成长', '温暖', '青春'] },
  { title: '幻城', author: '郭敬明', tags: ['科幻', '冒险', '爱情'] },
  { title: '小时代', author: '郭敬明', tags: ['青春', '爱情', '友情'] },
  { title: '悲伤逆流成河', author: '郭敬明', tags: ['青春', '成长', '爱情'] },
  { title: '盗墓笔记', author: '南派三叔', tags: ['冒险', '悬疑', '友情'] },
  { title: '鬼吹灯', author: '天下霸唱', tags: ['冒险', '悬疑', '历史'] },
  { title: '斗破苍穹', author: '天蚕土豆', tags: ['冒险', '梦想', '勇气'] },
  { title: '武动乾坤', author: '天蚕土豆', tags: ['冒险', '成长', '勇气'] },
  { title: '大主宰', author: '天蚕土豆', tags: ['冒险', '梦想', '自由'] },
  { title: '全职高手', author: '蝴蝶蓝', tags: ['梦想', '友情', '勇气'] },
  { title: '盗墓笔记之沙海', author: '南派三叔', tags: ['冒险', '悬疑', '成长'] },
  { title: '魔道祖师', author: '墨香铜臭', tags: ['爱情', '友情', '冒险'] },
  { title: '陈情令', author: '墨香铜臭', tags: ['爱情', '友情', '勇气'] },
  { title: '天官赐福', author: '墨香铜臭', tags: ['爱情', '友情', '希望'] }
];

const books: Book[] = BOOK_DATABASE.map(book => ({
  ...book,
  id: uuidv4()
}));

const AVATAR_COLORS: string[] = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1',
  '#FF69B4', '#32CD32', '#FF7F50', '#9370DB'
];

function getRandomAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

function extractKeywords(text: string): string[] {
  const keywords: string[] = [];
  const lowerText = text.toLowerCase();
  
  for (const tag of PREDEFINED_TAGS) {
    if (lowerText.includes(tag.toLowerCase())) {
      keywords.push(tag);
    }
  }
  
  return keywords;
}

function calculateMatchScore(
  bookTags: string[],
  userTags: string[],
  feelingKeywords: string[]
): number {
  const allUserTags = [...new Set([...userTags, ...feelingKeywords])];
  
  if (allUserTags.length === 0) {
    return 0;
  }
  
  let matches = 0;
  for (const tag of allUserTags) {
    if (bookTags.some(bookTag => bookTag.toLowerCase() === tag.toLowerCase())) {
      matches++;
    }
  }
  
  return Math.round((matches / allUserTags.length) * 100);
}

app.post('/api/users/register', (req: Request, res: Response) => {
  try {
    const { username } = req.body;
    
    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      return res.status(400).json({ error: '用户名不能为空' });
    }
    
    const existingUser = users.find(u => u.username === username.trim());
    if (existingUser) {
      return res.status(409).json({ error: '用户名已存在' });
    }
    
    const newUser: User = {
      id: uuidv4(),
      username: username.trim(),
      avatarColor: getRandomAvatarColor(),
      createdAt: new Date()
    };
    
    users.push(newUser);
    
    res.status(201).json({
      id: newUser.id,
      username: newUser.username,
      avatarColor: newUser.avatarColor
    });
  } catch (error) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.post('/api/boxes', (req: Request, res: Response) => {
  try {
    const { bookId, userId, feeling } = req.body;
    
    if (!bookId || !userId || !feeling) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    const book = books.find(b => b.id === bookId);
    if (!book) {
      return res.status(404).json({ error: '书籍不存在' });
    }
    
    const newBox: Box = {
      id: uuidv4(),
      bookId,
      userId,
      username: user.username,
      avatarColor: user.avatarColor,
      feeling: feeling.trim(),
      createdAt: new Date()
    };
    
    boxes.push(newBox);
    
    res.status(201).json({
      id: newBox.id,
      bookId: newBox.bookId,
      userId: newBox.userId,
      username: newBox.username,
      avatarColor: newBox.avatarColor,
      feeling: newBox.feeling,
      createdAt: newBox.createdAt,
      book: book
    });
  } catch (error) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.get('/api/boxes', (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    
    let resultBoxes = [...boxes];
    
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      resultBoxes = resultBoxes.filter(box => {
        const book = books.find(b => b.id === box.bookId);
        return (
          box.feeling.toLowerCase().includes(searchLower) ||
          box.username.toLowerCase().includes(searchLower) ||
          (book && book.title.toLowerCase().includes(searchLower)) ||
          (book && book.author.toLowerCase().includes(searchLower)) ||
          (book && book.tags.some(tag => tag.toLowerCase().includes(searchLower)))
        );
      });
    }
    
    const boxesWithBooks = resultBoxes.map(box => {
      const book = books.find(b => b.id === box.bookId);
      return {
        ...box,
        book
      };
    });
    
    res.json(boxesWithBooks);
  } catch (error) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.post('/api/boxes/:id/fish', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId, feeling } = req.body;
    
    if (!userId || !feeling) {
      return res.status(400).json({ error: '缺少必要参数' });
    }
    
    const box = boxes.find(b => b.id === id);
    if (!box) {
      return res.status(404).json({ error: '书箱不存在' });
    }
    
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    const book = books.find(b => b.id === box.bookId);
    if (!book) {
      return res.status(404).json({ error: '书籍不存在' });
    }
    
    const feelingKeywords = extractKeywords(feeling.trim());
    
    const newFishing: Fishing = {
      id: uuidv4(),
      userId,
      boxId: box.id,
      bookId: box.bookId,
      feeling: feeling.trim(),
      tags: feelingKeywords,
      createdAt: new Date()
    };
    
    fishings.push(newFishing);
    
    const boxIndex = boxes.findIndex(b => b.id === id);
    if (boxIndex > -1) {
      boxes.splice(boxIndex, 1);
    }
    
    res.status(201).json({
      id: newFishing.id,
      userId: newFishing.userId,
      boxId: newFishing.boxId,
      bookId: newFishing.bookId,
      feeling: newFishing.feeling,
      tags: newFishing.tags,
      createdAt: newFishing.createdAt,
      book: book
    });
  } catch (error) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.get('/api/fishings/:userId/recommendations', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const user = users.find(u => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    const userFishings = fishings.filter(f => f.userId === userId);
    
    const userTags = new Set<string>();
    const userFeelingKeywords = new Set<string>();
    
    for (const fishing of userFishings) {
      const book = books.find(b => b.id === fishing.bookId);
      if (book) {
        book.tags.forEach(tag => userTags.add(tag));
      }
      fishing.tags.forEach(tag => userFeelingKeywords.add(tag));
    }
    
    const fishedBookIds = new Set(userFishings.map(f => f.bookId));
    
    const recommendations: Recommendation[] = books
      .filter(book => !fishedBookIds.has(book.id))
      .map(book => ({
        bookId: book.id,
        title: book.title,
        author: book.author,
        tags: book.tags,
        matchScore: calculateMatchScore(
          book.tags,
          Array.from(userTags),
          Array.from(userFeelingKeywords)
        )
      }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 20);
    
    res.json({
      userId,
      userTags: Array.from(userTags),
      userFeelingKeywords: Array.from(userFeelingKeywords),
      recommendations
    });
  } catch (error) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.get('/api/books', (_req: Request, res: Response) => {
  res.json(books);
});

app.get('/api/users/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = users.find(u => u.id === id);
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`已加载 ${books.length} 本书籍数据`);
  console.log(`预定义标签: ${PREDEFINED_TAGS.join(', ')}`);
});
