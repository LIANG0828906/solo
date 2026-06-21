import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, users } from './users.js';

const router = Router();

router.use(authMiddleware);

interface DocComment {
  id: string;
  documentId: string;
  userId: string;
  username: string;
  avatar: string;
  content: string;
  createdAt: string;
  replies: DocComment[];
}

interface DocVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  content: string;
  createdAt: string;
}

interface Document {
  id: string;
  title: string;
  content: string;
  type: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

const documents: Document[] = [
  {
    id: 'doc-1',
    title: '2024年Q1产品技术方案',
    content: '# 产品技术方案\n\n## 一、项目背景\n\n随着团队规模扩大，现有的文档管理方式已无法满足协作需求。我们需要一套在线文档协作系统，支持实时编辑、评论和版本管理。\n\n## 二、技术选型\n\n- **前端**: React + TypeScript\n- **后端**: Node.js + Express\n- **数据库**: PostgreSQL\n- **实时通信**: WebSocket\n\n## 三、核心功能\n\n1. 文档实时协同编辑\n2. 评论与讨论\n3. 版本历史管理\n4. 全文搜索\n\n## 四、实施计划\n\n| 阶段 | 内容 | 时间 |\n|------|------|------|\n| 一 | 基础架构搭建 | 2周 |\n| 二 | 核心功能开发 | 4周 |\n| 三 | 测试与优化 | 2周 |',
    type: '技术方案',
    userId: '1',
    createdAt: '2024-01-15T08:00:00.000Z',
    updatedAt: '2024-03-20T10:30:00.000Z'
  },
  {
    id: 'doc-2',
    title: '第12周团队周会会议记录',
    content: '# 团队周会记录\n\n**日期**: 2024年3月18日\n**参会人**: 张三、李四、王五\n\n## 议题一：项目进度同步\n\n- 前端模块完成80%\n- 后端API完成90%\n- 测试用例编写中\n\n## 议题二：下周计划\n\n1. 完成前端剩余页面\n2. 联调测试\n3. 性能优化\n\n## 议题三：风险项\n\n- 第三方接口响应较慢，需增加超时处理\n- 移动端适配需额外2天',
    type: '会议记录',
    userId: '2',
    createdAt: '2024-03-18T09:00:00.000Z',
    updatedAt: '2024-03-18T10:15:00.000Z'
  },
  {
    id: 'doc-3',
    title: '用户反馈分析报告-3月',
    content: '# 用户反馈分析报告\n\n## 概述\n\n本月共收集用户反馈 156 条，较上月增长 12%。\n\n## 关键数据\n\n- 正面反馈: 68%\n- 中性反馈: 20%\n- 负面反馈: 12%\n\n## 主要问题\n\n1. **搜索功能不够精准** - 23条反馈提及\n2. **页面加载速度慢** - 18条反馈提及\n3. **移动端体验差** - 15条反馈提及\n\n## 改进建议\n\n- 优化搜索算法，引入分词匹配\n- 实施CDN加速，优化首屏加载\n- 响应式改造，优先适配移动端',
    type: '分析报告',
    userId: '1',
    createdAt: '2024-03-01T08:00:00.000Z',
    updatedAt: '2024-03-25T14:20:00.000Z'
  },
  {
    id: 'doc-4',
    title: 'RESTful API设计规范',
    content: '# API 设计规范\n\n## 1. URL设计\n\n- 使用名词复数形式: `/api/users`\n- 层级关系: `/api/users/:id/posts`\n- 查询参数: `/api/posts?status=published`\n\n## 2. HTTP方法\n\n| 方法 | 用途 | 示例 |\n|------|------|------|\n| GET | 获取资源 | GET /api/users |\n| POST | 创建资源 | POST /api/users |\n| PUT | 全量更新 | PUT /api/users/1 |\n| PATCH | 增量更新 | PATCH /api/users/1 |\n| DELETE | 删除资源 | DELETE /api/users/1 |\n\n## 3. 状态码\n\n- 200: 成功\n- 201: 创建成功\n- 400: 请求错误\n- 401: 未认证\n- 403: 无权限\n- 404: 未找到\n- 500: 服务器错误\n\n## 4. 响应格式\n\n```json\n{\n  \"code\": 200,\n  \"message\": \"success\",\n  \"data\": {}\n}\n```',
    type: '技术方案',
    userId: '3',
    createdAt: '2024-02-10T08:00:00.000Z',
    updatedAt: '2024-03-15T16:45:00.000Z'
  },
  {
    id: 'doc-5',
    title: '2024年Q1季度总结',
    content: '# Q1季度总结\n\n## 业绩概览\n\n- 营收目标完成率: 105%\n- 新增用户: 12,500\n- 用户留存率: 78%\n\n## 重点项目\n\n### 文档协作系统\n按时交付，用户满意度4.5/5\n\n### 移动端改造\n进度略有延迟，预计Q2初完成\n\n## 团队建设\n\n- 新入职3名前端工程师\n- 组织2次技术分享会\n- 团队满意度调查得分4.2/5\n\n## Q2展望\n\n1. 完成移动端改造上线\n2. 启动智能推荐项目\n3. 用户量突破50万',
    type: '会议记录',
    userId: '2',
    createdAt: '2024-03-30T08:00:00.000Z',
    updatedAt: '2024-04-02T09:00:00.000Z'
  },
  {
    id: 'doc-6',
    title: '前端性能优化方案',
    content: '# 前端性能优化方案\n\n## 优化目标\n\n- 首屏加载 < 2s\n- FCP < 1.5s\n- LCP < 2.5s\n- CLS < 0.1\n\n## 优化策略\n\n### 代码层面\n1. 路由懒加载\n2. 组件按需加载\n3. 图片懒加载\n4. 虚拟列表\n\n### 资源层面\n1. Gzip压缩\n2. 资源预加载\n3. Service Worker缓存\n4. CDN加速\n\n### 渲染层面\n1. 减少重排重绘\n2. CSS containment\n3. will-change优化\n4. requestAnimationFrame\n\n## 效果预期\n\n| 指标 | 优化前 | 优化后 |\n|------|--------|--------|\n| FCP | 3.2s | 1.2s |\n| LCP | 4.5s | 2.0s |\n| TTI | 5.1s | 2.8s |',
    type: '技术方案',
    userId: '1',
    createdAt: '2024-03-10T08:00:00.000Z',
    updatedAt: '2024-03-28T11:30:00.000Z'
  }
];

const comments: DocComment[] = [
  { id: 'c1', documentId: 'doc-1', userId: '2', username: 'zhangsan', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan', content: '技术选型部分很清晰，建议补充一下备选方案的对比', createdAt: '2024-03-20T09:00:00.000Z', replies: [] },
  { id: 'c2', documentId: 'doc-1', userId: '3', username: 'lisi', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lisi', content: '实施计划的时间安排是否合理？第二阶段4周可能不够', createdAt: '2024-03-20T10:00:00.000Z', replies: [
    { id: 'c2-r1', documentId: 'doc-1', userId: '1', username: 'admin', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', content: '已考虑缓冲时间，4周是基于之前项目的经验评估', createdAt: '2024-03-20T10:30:00.000Z', replies: [] }
  ]},
  { id: 'c3', documentId: 'doc-2', userId: '1', username: 'admin', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', content: '第三方接口的问题需要尽快跟进，可以安排一次专项讨论', createdAt: '2024-03-18T11:00:00.000Z', replies: [] },
  { id: 'c4', documentId: 'doc-3', userId: '2', username: 'zhangsan', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangsan', content: '搜索优化的优先级应该提高，这是用户反馈最多的问题', createdAt: '2024-03-25T15:00:00.000Z', replies: [] },
  { id: 'c5', documentId: 'doc-4', userId: '1', username: 'admin', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', content: '规范写得很详细，建议加上错误码的完整定义', createdAt: '2024-03-15T17:00:00.000Z', replies: [] }
];

const versions: DocVersion[] = [
  { id: 'v1-1', documentId: 'doc-1', versionNumber: 1, content: '# 产品技术方案\n\n## 一、项目背景\n\n团队文档协作需求分析。', createdAt: '2024-01-15T08:00:00.000Z' },
  { id: 'v1-2', documentId: 'doc-1', versionNumber: 2, content: '# 产品技术方案\n\n## 一、项目背景\n\n随着团队规模扩大，现有的文档管理方式已无法满足协作需求。\n\n## 二、技术选型\n\n- **前端**: React + TypeScript\n- **后端**: Node.js + Express', createdAt: '2024-02-01T10:00:00.000Z' },
  { id: 'v1-3', documentId: 'doc-1', versionNumber: 3, content: documents[0].content, createdAt: '2024-03-20T10:30:00.000Z' },
  { id: 'v2-1', documentId: 'doc-2', versionNumber: 1, content: '# 团队周会记录\n\n**日期**: 2024年3月18日\n**参会人**: 张三、李四、王五\n\n## 议题一：项目进度同步\n\n- 前端模块完成80%\n- 后端API完成90%', createdAt: '2024-03-18T09:30:00.000Z' },
  { id: 'v2-2', documentId: 'doc-2', versionNumber: 2, content: documents[1].content, createdAt: '2024-03-18T10:15:00.000Z' },
  { id: 'v3-1', documentId: 'doc-3', versionNumber: 1, content: '# 用户反馈分析报告\n\n## 概述\n\n本月共收集用户反馈 156 条。', createdAt: '2024-03-01T08:00:00.000Z' },
  { id: 'v3-2', documentId: 'doc-3', versionNumber: 2, content: documents[2].content, createdAt: '2024-03-25T14:20:00.000Z' }
];

router.get('/', (req: Request, res: Response) => {
  const { type, search } = req.query;
  let result = [...documents];
  if (type && type !== 'all') {
    result = result.filter(d => d.type === type);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    result = result.filter(d => d.title.toLowerCase().includes(q));
  }
  result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  res.json({ documents: result });
});

router.get('/:id', (req: Request, res: Response) => {
  const doc = documents.find(d => d.id === req.params.id);
  if (!doc) {
    res.status(404).json({ error: '文档不存在' });
    return;
  }
  const docComments = comments.filter(c => c.documentId === doc.id);
  res.json({ document: doc, comments: docComments });
});

router.post('/', (req: Request, res: Response) => {
  const { title, content, type } = req.body;
  if (!title) {
    res.status(400).json({ error: '标题不能为空' });
    return;
  }
  const now = new Date().toISOString();
  const doc: Document = {
    id: uuidv4(),
    title,
    content: content || '',
    type: type || '未分类',
    userId: req.user!.id,
    createdAt: now,
    updatedAt: now
  };
  documents.push(doc);
  const firstVersion: DocVersion = {
    id: uuidv4(),
    documentId: doc.id,
    versionNumber: 1,
    content: doc.content,
    createdAt: now
  };
  versions.push(firstVersion);
  res.status(201).json({ document: doc });
});

router.patch('/:id', (req: Request, res: Response) => {
  const doc = documents.find(d => d.id === req.params.id);
  if (!doc) {
    res.status(404).json({ error: '文档不存在' });
    return;
  }
  const { title, content, type } = req.body;
  if (title !== undefined) doc.title = title;
  if (type !== undefined) doc.type = type;
  if (content !== undefined) {
    doc.content = content;
    const docVersions = versions.filter(v => v.documentId === doc.id);
    const maxVer = docVersions.reduce((max, v) => Math.max(max, v.versionNumber), 0);
    const newVersion: DocVersion = {
      id: uuidv4(),
      documentId: doc.id,
      versionNumber: maxVer + 1,
      content: doc.content,
      createdAt: new Date().toISOString()
    };
    versions.push(newVersion);
  }
  doc.updatedAt = new Date().toISOString();
  res.json({ document: doc });
});

router.get('/:id/versions', (req: Request, res: Response) => {
  const docVersions = versions
    .filter(v => v.documentId === req.params.id)
    .sort((a, b) => a.versionNumber - b.versionNumber);
  res.json({ versions: docVersions });
});

router.get('/:id/versions/:versionId', (req: Request, res: Response) => {
  const version = versions.find(v => v.id === req.params.versionId);
  if (!version) {
    res.status(404).json({ error: '版本不存在' });
    return;
  }
  res.json({ version });
});

router.post('/:id/comments', (req: Request, res: Response) => {
  const doc = documents.find(d => d.id === req.params.id);
  if (!doc) {
    res.status(404).json({ error: '文档不存在' });
    return;
  }
  const { content, replyTo } = req.body;
  if (!content) {
    res.status(400).json({ error: '评论内容不能为空' });
    return;
  }
  const user = users.find(u => u.id === req.user!.id);
  const username = user?.username || req.user!.username;
  const avatar = user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
  const now = new Date().toISOString();

  if (replyTo) {
    const parent = comments.find(c => c.id === replyTo);
    if (!parent) {
      res.status(404).json({ error: '父评论不存在' });
      return;
    }
    const reply: DocComment = {
      id: uuidv4(),
      documentId: doc.id,
      userId: req.user!.id,
      username,
      avatar,
      content,
      createdAt: now,
      replies: []
    };
    parent.replies.push(reply);
    res.status(201).json({ comment: reply });
    return;
  }

  const comment: DocComment = {
    id: uuidv4(),
    documentId: doc.id,
    userId: req.user!.id,
    username,
    avatar,
    content,
    createdAt: now,
    replies: []
  };
  comments.push(comment);
  res.status(201).json({ comment });
});

export default router;
