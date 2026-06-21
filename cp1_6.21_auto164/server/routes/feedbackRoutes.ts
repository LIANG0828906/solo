import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

export interface Feedback {
  id: string;
  userId: string;
  userName: string;
  userGroup: 'frontend' | 'backend' | 'design';
  mood: 1 | 2 | 3 | 4 | 5;
  content: string;
  obstacle: 'dependency' | 'technical' | 'resource' | null;
  efficiency: 3 | 4 | 5;
  createdAt: string;
}

const router = Router();

const generateMockData = (): Feedback[] => {
  const names = [
    { name: '张明', group: 'frontend' as const },
    { name: '李华', group: 'backend' as const },
    { name: '王芳', group: 'design' as const },
    { name: '赵强', group: 'frontend' as const },
    { name: '陈静', group: 'backend' as const },
    { name: '刘洋', group: 'design' as const },
    { name: '孙伟', group: 'frontend' as const },
    { name: '周雪', group: 'backend' as const },
  ];
  const obstacles: Array<Feedback['obstacle']> = [null, 'dependency', 'technical', 'resource'];
  const moods: Feedback['mood'][] = [1, 2, 3, 4, 5];
  const efficiencies: Feedback['efficiency'][] = [3, 4, 5];
  const contents = [
    '完成了登录模块的开发，今天效率不错。',
    '修复了一个关键bug，配合测试团队验证中。',
    '完成了首页的UI设计稿，等待评审。',
    '优化了数据库查询性能，响应时间降低30%。',
    '和产品经理对齐了需求，开始技术方案设计。',
    '协助前端联调接口，解决了几个跨域问题。',
    '完成了组件库的按钮组件，增加了主题切换。',
    '调研了新的微前端方案，准备输出技术文档。',
  ];
  const data: Feedback[] = [];

  for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
    const date = new Date();
    date.setDate(date.getDate() - dayOffset);
    const dateStr = date.toISOString().split('T')[0];
    const feedbacksPerDay = 3 + Math.floor(Math.random() * 5);

    for (let i = 0; i < feedbacksPerDay; i++) {
      const user = names[Math.floor(Math.random() * names.length)];
      const createdAt = new Date(date);
      createdAt.setHours(9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60));
      data.push({
        id: uuidv4(),
        userId: uuidv4(),
        userName: user.name,
        userGroup: user.group,
        mood: moods[Math.floor(Math.random() * moods.length)],
        content: contents[Math.floor(Math.random() * contents.length)],
        obstacle: obstacles[Math.floor(Math.random() * obstacles.length)],
        efficiency: efficiencies[Math.floor(Math.random() * efficiencies.length)],
        createdAt: createdAt.toISOString(),
      });
    }
  }

  return data;
};

export let feedbacks: Feedback[] = generateMockData();

router.post('/', (req: Request, res: Response) => {
  const { userName, userGroup, mood, content, obstacle = null, efficiency } = req.body;

  if (!userName || !userGroup || !mood || !content || !efficiency) {
    return res.status(400).json({ success: false, message: '缺少必填字段' });
  }

  const newFeedback: Feedback = {
    id: uuidv4(),
    userId: uuidv4(),
    userName,
    userGroup,
    mood,
    content,
    obstacle,
    efficiency,
    createdAt: new Date().toISOString(),
  };

  feedbacks.unshift(newFeedback);

  const io = req.app.get('io');
  if (io) {
    io.emit('new-feedback', {
      message: `${userName} 提交了今日反馈`,
      userName,
    });
  }

  res.json({ success: true, data: newFeedback });
});

router.get('/', (_req: Request, res: Response) => {
  res.json({ success: true, data: feedbacks });
});

export default router;
