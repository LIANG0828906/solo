import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { Task, Comment, TeamMember, TaskStatus } from '../types';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const teamMembers: TeamMember[] = [
  { id: '1', name: '张三', avatarColor: '#667eea' },
  { id: '2', name: '李四', avatarColor: '#764ba2' },
  { id: '3', name: '王五', avatarColor: '#f093fb' },
  { id: '4', name: '赵六', avatarColor: '#4facfe' },
];

const cardColors = ['#E53935', '#1E88E5', '#43A047', '#FB8C00'];

const getRandomColor = (): string => {
  return cardColors[Math.floor(Math.random() * cardColors.length)];
};

const formatDate = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}月${day}日 ${hours}:${minutes}`;
};

const initialTasks: Task[] = [
  {
    id: uuidv4(),
    title: '完成用户界面设计',
    description: '设计首页和用户个人中心的界面原型，包括响应式布局和交互动效。需要与产品经理确认需求细节后开始实施。',
    status: 'todo',
    assignee: teamMembers[0],
    color: getRandomColor(),
    createdAt: formatDate(new Date(Date.now() - 86400000 * 2)),
    comments: [
      {
        id: uuidv4(),
        taskId: '',
        author: teamMembers[1],
        content: '设计稿可以参考上次会议的讨论结果',
        createdAt: formatDate(new Date(Date.now() - 86400000))
      }
    ],
    order: 0
  },
  {
    id: uuidv4(),
    title: '后端API开发',
    description: '开发用户认证和任务管理相关的RESTful API接口，包括登录注册、任务CRUD操作。',
    status: 'todo',
    assignee: teamMembers[1],
    color: getRandomColor(),
    createdAt: formatDate(new Date(Date.now() - 86400000)),
    comments: [],
    order: 1
  },
  {
    id: uuidv4(),
    title: '数据库表结构设计',
    description: '根据需求文档设计用户、任务、评论等核心表结构，考虑性能优化和索引设计。',
    status: 'inProgress',
    assignee: teamMembers[2],
    color: getRandomColor(),
    createdAt: formatDate(new Date(Date.now() - 86400000 * 3)),
    comments: [
      {
        id: uuidv4(),
        taskId: '',
        author: teamMembers[0],
        content: '记得添加软删除字段',
        createdAt: formatDate(new Date(Date.now() - 86400000 * 2))
      }
    ],
    order: 0
  },
  {
    id: uuidv4(),
    title: '编写单元测试',
    description: '为核心业务逻辑编写单元测试用例，确保代码覆盖率达到80%以上。',
    status: 'inProgress',
    assignee: teamMembers[3],
    color: getRandomColor(),
    createdAt: formatDate(new Date(Date.now() - 86400000 * 2)),
    comments: [],
    order: 1
  },
  {
    id: uuidv4(),
    title: '项目需求评审',
    description: '与客户确认项目需求细节，完成需求评审会议并输出评审纪要。',
    status: 'done',
    assignee: teamMembers[0],
    color: getRandomColor(),
    createdAt: formatDate(new Date(Date.now() - 86400000 * 5)),
    comments: [
      {
        id: uuidv4(),
        taskId: '',
        author: teamMembers[2],
        content: '需求文档已同步到共享文件夹',
        createdAt: formatDate(new Date(Date.now() - 86400000 * 4))
      },
      {
        id: uuidv4(),
        taskId: '',
        author: teamMembers[1],
        content: '客户已确认，同意按计划执行',
        createdAt: formatDate(new Date(Date.now() - 86400000 * 3))
      }
    ],
    order: 0
  },
  {
    id: uuidv4(),
    title: '技术选型调研',
    description: '调研前端框架和后端技术栈，输出技术选型报告供团队讨论。',
    status: 'done',
    assignee: teamMembers[1],
    color: getRandomColor(),
    createdAt: formatDate(new Date(Date.now() - 86400000 * 7)),
    comments: [],
    order: 1
  }
];

initialTasks.forEach(task => {
  task.comments.forEach(comment => {
    comment.taskId = task.id;
  });
});

let tasks: Task[] = [...initialTasks];

app.get('/api/members', (_req: Request, res: Response) => {
  res.json(teamMembers);
});

app.get('/api/tasks', (_req: Request, res: Response) => {
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.status !== b.status) {
      const statusOrder: Record<TaskStatus, number> = { todo: 0, inProgress: 1, done: 2 };
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return a.order - b.order;
  });
  res.json(sortedTasks);
});

app.post('/api/tasks', (req: Request, res: Response) => {
  const { title, description, assigneeId } = req.body;
  
  if (!title || !assigneeId) {
    return res.status(400).json({ error: '标题和负责人为必填项' });
  }
  
  if (title.length > 50) {
    return res.status(400).json({ error: '标题不能超过50字' });
  }
  
  if (description && description.length > 200) {
    return res.status(400).json({ error: '描述不能超过200字' });
  }
  
  const assignee = teamMembers.find(m => m.id === assigneeId);
  if (!assignee) {
    return res.status(400).json({ error: '无效的负责人' });
  }
  
  const todoTasks = tasks.filter(t => t.status === 'todo');
  const maxOrder = todoTasks.length > 0 ? Math.max(...todoTasks.map(t => t.order)) : -1;
  
  const newTask: Task = {
    id: uuidv4(),
    title: title.trim(),
    description: description ? description.trim() : '',
    status: 'todo',
    assignee,
    color: getRandomColor(),
    createdAt: formatDate(new Date()),
    comments: [],
    order: maxOrder + 1
  };
  
  tasks.push(newTask);
  res.status(201).json(newTask);
});

app.put('/api/tasks/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, order } = req.body;
  
  if (!status || !['todo', 'inProgress', 'done'].includes(status)) {
    return res.status(400).json({ error: '无效的状态值' });
  }
  
  const taskIndex = tasks.findIndex(t => t.id === id);
  if (taskIndex === -1) {
    return res.status(404).json({ error: '任务不存在' });
  }
  
  const oldStatus = tasks[taskIndex].status;
  const newStatus = status as TaskStatus;
  
  tasks[taskIndex].status = newStatus;
  
  if (oldStatus !== newStatus) {
    const sameStatusTasks = tasks.filter(t => t.status === newStatus && t.id !== id);
    const newOrder = typeof order === 'number' ? order : sameStatusTasks.length;
    
    sameStatusTasks.forEach(t => {
      if (t.order >= newOrder) {
        t.order += 1;
      }
    });
    
    tasks[taskIndex].order = newOrder;
  } else if (typeof order === 'number') {
    tasks[taskIndex].order = order;
  }
  
  const sameStatusTasks = tasks.filter(t => t.status === newStatus);
  sameStatusTasks.sort((a, b) => a.order - b.order);
  sameStatusTasks.forEach((t, i) => {
    t.order = i;
  });
  
  res.json(tasks[taskIndex]);
});

app.post('/api/tasks/:id/comments', (req: Request, res: Response) => {
  const { id } = req.params;
  const { content, authorId } = req.body;
  
  if (!content || !authorId) {
    return res.status(400).json({ error: '评论内容和作者为必填项' });
  }
  
  const task = tasks.find(t => t.id === id);
  if (!task) {
    return res.status(404).json({ error: '任务不存在' });
  }
  
  const author = teamMembers.find(m => m.id === authorId);
  if (!author) {
    return res.status(400).json({ error: '无效的作者' });
  }
  
  const newComment: Comment = {
    id: uuidv4(),
    taskId: id,
    author,
    content: content.trim(),
    createdAt: formatDate(new Date())
  };
  
  task.comments.push(newComment);
  res.status(201).json(newComment);
});

app.get('/api/stats', (_req: Request, res: Response) => {
  const now = new Date();
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  
  const completedThisWeek = tasks.filter(t => t.status === 'done').length;
  
  res.json({ completedThisWeek });
});

app.listen(PORT, () => {
  console.log(`后端服务器运行在 http://localhost:${PORT}`);
});
