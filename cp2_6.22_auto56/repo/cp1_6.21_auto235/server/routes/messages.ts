import { Router, Request, Response } from 'express';

const router = Router();

interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  from: string;
  bookId: string;
  bookTitle: string;
  content: string;
  time: string;
  read: boolean;
}

const mockMessages: Message[] = [
  {
    id: 'm1',
    fromUserId: '10',
    toUserId: '1',
    from: '学弟小明',
    bookId: 'p1',
    bookTitle: '数据结构（C语言版）',
    content: '你好，请问这本书还在吗？我想下午在图书馆见面交易可以吗？',
    time: '2024-06-20 15:30',
    read: false,
  },
  {
    id: 'm2',
    fromUserId: '11',
    toUserId: '1',
    from: '同学小王',
    bookId: 'p2',
    bookTitle: '计算机网络（第七版）',
    content: '请问能便宜点吗？20块可以吗？',
    time: '2024-06-19 10:15',
    read: false,
  },
];

router.get('/', (req: Request, res: Response) => {
  const { userId } = req.query;
  const userMessages = mockMessages.filter((m) => m.toUserId === userId || m.fromUserId === userId);
  res.json(userMessages);
});

router.post('/', (req: Request, res: Response) => {
  const { fromUserId, toUserId, bookId, content } = req.body;

  const newMessage: Message = {
    id: String(Date.now()),
    fromUserId,
    toUserId,
    from: '当前用户',
    bookId,
    bookTitle: '相关教材',
    content,
    time: new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).replace(/\//g, '-'),
    read: false,
  };

  mockMessages.push(newMessage);
  res.status(201).json(newMessage);
});

router.put('/:id/read', (req: Request, res: Response) => {
  const { id } = req.params;
  const message = mockMessages.find((m) => m.id === id);

  if (!message) {
    return res.status(404).json({ error: 'Message not found' });
  }

  message.read = true;
  res.json(message);
});

router.get('/unread-count', (req: Request, res: Response) => {
  const { userId } = req.query;
  const unreadCount = mockMessages.filter((m) => m.toUserId === userId && !m.read).length;
  res.json({ count: unreadCount });
});

export default router;
