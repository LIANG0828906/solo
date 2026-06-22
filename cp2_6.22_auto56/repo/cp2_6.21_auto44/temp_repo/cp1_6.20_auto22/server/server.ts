import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, '..', 'data', 'memos.json');

app.use(cors());
app.use(bodyParser.json());

interface Memo {
  id: string;
  title: string;
  content: string;
  creator: string;
  creatorAvatar: string;
  createdAt: string;
  dueTime: string | null;
  completed: boolean;
  notified: boolean;
}

const getInitialData = (): Memo[] => {
  const now = new Date();
  const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);
  const in2Days = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const in5Days = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  return [
    {
      id: uuidv4(),
      title: '项目周会准备',
      content: '# 会议议程\n\n- **项目进度回顾**：各模块开发进展\n- ==问题讨论==：当前遇到的技术难点\n- 下周计划：任务分配和里程碑',
      creator: '张三',
      creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan',
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      dueTime: in2Days.toISOString(),
      completed: false,
      notified: false,
    },
    {
      id: uuidv4(),
      title: '设计评审会议',
      content: '# 评审要点\n\n- **UI设计稿**：首页和详情页设计\n- ==交互流程==：用户操作路径优化\n- **响应式适配**：移动端和桌面端\n\n请提前准备好设计稿和原型图。',
      creator: '李四',
      creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisi',
      createdAt: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
      dueTime: in5Days.toISOString(),
      completed: false,
      notified: false,
    },
    {
      id: uuidv4(),
      title: '代码审查安排',
      content: '本周完成核心模块代码审查，重点关注性能和安全性。',
      creator: '王五',
      creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangwu',
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      dueTime: null,
      completed: true,
      notified: false,
    },
    {
      id: uuidv4(),
      title: '产品需求评审',
      content: '# 评审内容\n\n- **用户反馈汇总**：近期用户问题整理\n- **新功能优先级**：下季度功能规划\n- ==技术可行性==：实现方案讨论',
      creator: '张三',
      creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan',
      createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      dueTime: in1Hour.toISOString(),
      completed: false,
      notified: false,
    },
    {
      id: uuidv4(),
      title: '紧急Bug修复',
      content: '==紧急==：修复用户登录页面白屏问题，影响所有新用户注册。',
      creator: '李四',
      creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisi',
      createdAt: yesterday.toISOString(),
      dueTime: yesterday.toISOString(),
      completed: false,
      notified: true,
    },
  ];
};

const ensureDataFile = () => {
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(getInitialData()));
  }
};

const readMemos = (): Memo[] => {
  ensureDataFile();
  const data = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(data);
};

const writeMemos = (memos: Memo[]) => {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(memos, null, 2));
};

app.get('/api/memos', (_req, res) => {
  try {
    const memos = readMemos();
    res.json(memos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read memos' });
  }
});

app.post('/api/memos', (req, res) => {
  try {
    const memos = readMemos();
    const newMemo: Memo = {
      id: uuidv4(),
      title: req.body.title,
      content: req.body.content,
      creator: req.body.creator || '匿名用户',
      creatorAvatar: req.body.creatorAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
      createdAt: new Date().toISOString(),
      dueTime: req.body.dueTime || null,
      completed: false,
      notified: false,
    };
    memos.unshift(newMemo);
    writeMemos(memos);
    res.status(201).json(newMemo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create memo' });
  }
});

app.put('/api/memos/:id', (req, res) => {
  try {
    const memos = readMemos();
    const index = memos.findIndex(m => m.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Memo not found' });
    }
    memos[index] = { ...memos[index], ...req.body };
    writeMemos(memos);
    res.json(memos[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update memo' });
  }
});

app.delete('/api/memos/:id', (req, res) => {
  try {
    let memos = readMemos();
    memos = memos.filter(m => m.id !== req.params.id);
    writeMemos(memos);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete memo' });
  }
});

app.get('/api/memos/check-due', (_req, res) => {
  try {
    const memos = readMemos();
    const now = new Date();
    const dueMemos = memos.filter(m => {
      if (!m.dueTime || m.completed || m.notified) return false;
      const dueDate = new Date(m.dueTime);
      return now >= dueDate;
    });
    res.json(dueMemos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check due memos' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  ensureDataFile();
});
