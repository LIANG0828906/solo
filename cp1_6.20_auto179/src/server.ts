import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { initialTasks, initialMembers, Task, Comment, Member } from './data';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let tasks: Task[] = JSON.parse(JSON.stringify(initialTasks));
let members: Member[] = JSON.parse(JSON.stringify(initialMembers));

app.get('/api/tasks', (_req: Request, res: Response) => {
  res.json(tasks);
});

app.post('/api/tasks/:id/comments', (req: Request, res: Response) => {
  const { id } = req.params;
  const { author, content } = req.body;

  if (!author || !content) {
    return res.status(400).json({ error: '作者和内容不能为空' });
  }

  const taskIndex = tasks.findIndex((t) => t.id === id);
  if (taskIndex === -1) {
    return res.status(404).json({ error: '任务不存在' });
  }

  const newComment: Comment = {
    id: uuidv4(),
    taskId: id,
    author,
    content,
    createdAt: Date.now(),
  };

  tasks[taskIndex].comments.push(newComment);
  res.status(201).json(newComment);
});

app.get('/api/members', (_req: Request, res: Response) => {
  res.json(members);
});

app.get('/api/members/:id/report', (req: Request, res: Response) => {
  const { id } = req.params;

  const member = members.find((m) => m.id === id);
  if (!member) {
    return res.status(404).json({ error: '成员不存在' });
  }

  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  const memberTasks = tasks.filter((t) => t.assigneeId === id);
  const completedTasks = memberTasks.filter(
    (t) => t.status === 'done' && t.statusChangedAt >= sevenDaysAgo
  );
  const pendingTasks = memberTasks.filter((t) => t.status !== 'done');

  let avgProcessingTime = 0;
  if (completedTasks.length > 0) {
    const totalTime = completedTasks.reduce((sum, t) => {
      return sum + (t.statusChangedAt - t.createdAt);
    }, 0);
    avgProcessingTime = Math.round(totalTime / completedTasks.length / (1000 * 60 * 60 * 24));
  }

  const reportContent = `# ${member.name} 近7天工作报告

## 任务完成情况
- **完成任务数**: ${completedTasks.length} 个
- **平均处理时长**: ${avgProcessingTime} 天
- **未完成任务数**: ${pendingTasks.length} 个

## 已完成任务详情
${completedTasks.length > 0 ? completedTasks.map((t) => `- ${t.title} (优先级: ${t.priority === 'high' ? '高' : t.priority === 'medium' ? '中' : '低'})`).join('\n') : '- 暂无已完成任务'}

## 进行中任务
${pendingTasks.filter(t => t.status === 'in-progress').map((t) => `- ${t.title} (截止日期: ${t.dueDate})`).join('\n') || '- 暂无进行中任务'}

## 待办任务
${pendingTasks.filter(t => t.status === 'todo').map((t) => `- ${t.title} (截止日期: ${t.dueDate})`).join('\n') || '- 暂无待办任务'}
`;

  res.json({
    memberId: id,
    memberName: member.name,
    report: reportContent,
    completedCount: completedTasks.length,
    avgProcessingDays: avgProcessingTime,
    pendingCount: pendingTasks.length,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
