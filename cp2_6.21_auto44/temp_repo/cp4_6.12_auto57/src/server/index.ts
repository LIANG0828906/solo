import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

type User = {
  id: string;
  nickname: string;
  avatar: string;
  signature: string;
  editCount: number;
  reviewPassRate: number;
  totalReviews: number;
  passedReviews: number;
};

type Version = {
  id: string;
  docId: string;
  version: string;
  major: number;
  minor: number;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  createdAt: string;
  summary: string;
  isPublished: boolean;
};

type Annotation = {
  id: string;
  docId: string;
  versionId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  signature: string;
  text: string;
  content: string;
  startOffset: number;
  endOffset: number;
  createdAt: string;
  replies: AnnotationReply[];
  resolved: boolean;
};

type AnnotationReply = {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  signature: string;
  content: string;
  createdAt: string;
};

type DocStatus = 'draft' | 'pending' | 'approved' | 'published';

type Document = {
  id: string;
  title: string;
  content: string;
  creatorId: string;
  creatorName: string;
  status: DocStatus;
  currentVersion: string;
  major: number;
  minor: number;
  createdAt: string;
  updatedAt: string;
  logConfig: {
    title: string;
    logo: string;
    copyright: string;
  };
};

const EMOJI_AVATARS = ['🦊', '🐼', '🦁', '🐯', '🐸', '🐵', '🐙', '🦄'];

const COLORS = ['#4a90d9', '#ff6b6b', '#52c41a', '#faad14', '#722ed1', '#13c2c2', '#eb2f96', '#fa541c'];

function getColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

class Database {
  users: Map<string, User> = new Map();
  documents: Map<string, Document> = new Map();
  versions: Map<string, Version> = new Map();
  annotations: Map<string, Annotation> = new Map();

  constructor() {
    this.init();
  }

  init() {
    const defaultUsers = [
      { id: 'user-1', nickname: '张三', avatar: '🦊', signature: '保持简单，保持优雅', editCount: 15, totalReviews: 10, passedReviews: 8 },
      { id: 'user-2', nickname: '李四', avatar: '🐼', signature: '代码如诗，文档如画', editCount: 23, totalReviews: 15, passedReviews: 13 },
      { id: 'user-3', nickname: '王五', avatar: '🦁', signature: '追求极致的工程师', editCount: 8, totalReviews: 5, passedReviews: 4 },
    ];
    defaultUsers.forEach((u) => {
      this.users.set(u.id, {
        ...u,
        reviewPassRate: u.totalReviews > 0 ? u.passedReviews / u.totalReviews : 0,
      });
    });

    const demoDocs = [
      {
        id: 'doc-1',
        title: 'API接口设计规范',
        creatorId: 'user-1',
        status: 'published' as DocStatus,
        content: `# API 接口设计规范

## 1. 概述

本文档定义了团队内部 RESTful API 接口的设计标准。

## 2. URL 设计规范

所有 API 接口必须遵循以下 URL 设计原则：

- 使用小写字母和连字符（kebab-case）
- 资源名称使用复数形式
- 版本号放在 URL 最前面

## 3. 请求方法

| 方法 | 用途 | 幂等性 |
|------|------|--------|
| GET | 获取资源 | 是 |
| POST | 创建资源 | 否 |
| PUT | 全量更新资源 | 是 |
| PATCH | 部分更新资源 | 否 |
| DELETE | 删除资源 | 是 |

## 4. 响应格式

统一使用 JSON 格式，包含以下字段：

\`\`\`json
{
  "code": 0,
  "message": "success",
  "data": {}
}
\`\`\`

> 注意：所有接口必须包含完整的错误处理。

## 5. 认证方式

使用 JWT Bearer Token 进行认证。

**示例请求：**
\`\`\`bash
curl -H "Authorization: Bearer <token>" https://api.example.com/v1/users
\`\`\`
`,
      },
      {
        id: 'doc-2',
        title: '前端代码评审指南',
        creatorId: 'user-2',
        status: 'pending' as DocStatus,
        content: `# 前端代码评审指南

## 1. 评审目标

通过代码评审提升代码质量，统一团队编码风格。

## 2. 检查清单

### 2.1 代码规范
- 是否符合 ESLint 配置
- 命名是否清晰
- 是否存在魔法数字

### 2.2 性能优化
- 列表是否有 key
- 是否存在不必要的重渲染
- 图片是否懒加载

### 2.3 可维护性
- 函数长度是否合适
- 注释是否清晰
- 是否有重复代码
`,
      },
    ];

    demoDocs.forEach((doc) => {
      const user = this.users.get(doc.creatorId)!;
      const document: Document = {
        id: doc.id,
        title: doc.title,
        content: doc.content,
        creatorId: doc.creatorId,
        creatorName: user.nickname,
        status: doc.status,
        currentVersion: 'v1.0',
        major: 1,
        minor: 0,
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        updatedAt: new Date().toISOString(),
        logConfig: {
          title: `${doc.title} 变更日志`,
          logo: '📄',
          copyright: `© 2026 ${user.nickname} 版权所有`,
        },
      };
      this.documents.set(doc.id, document);

      const version: Version = {
        id: uuidv4(),
        docId: doc.id,
        version: 'v1.0',
        major: 1,
        minor: 0,
        content: doc.content,
        authorId: doc.creatorId,
        authorName: user.nickname,
        authorAvatar: user.avatar,
        createdAt: document.createdAt,
        summary: '初始版本创建',
        isPublished: doc.status === 'published',
      };
      this.versions.set(version.id, version);
    });
  }

  getDocumentsByUser(userId: string): Document[] {
    const result: Document[] = [];
    for (const doc of this.documents.values()) {
      if (doc.creatorId === userId) result.push(doc);
    }
    return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  getAllDocuments(): Document[] {
    return Array.from(this.documents.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  getVersionsByDocId(docId: string): Version[] {
    const result: Version[] = [];
    for (const v of this.versions.values()) {
      if (v.docId === docId) result.push(v);
    }
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getAnnotationsByDocId(docId: string): Annotation[] {
    const result: Annotation[] = [];
    for (const a of this.annotations.values()) {
      if (a.docId === docId) result.push(a);
    }
    return result.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
}

const db = new Database();

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.post('/api/users/login', (req, res) => {
  const { nickname } = req.body as { nickname?: string };
  if (!nickname || nickname.trim().length < 1) {
    return res.status(400).json({ error: '昵称不能为空' });
  }

  let existingUser: User | undefined;
  for (const u of db.users.values()) {
    if (u.nickname === nickname) {
      existingUser = u;
      break;
    }
  }

  if (existingUser) {
    return res.json({ user: existingUser, isNew: false });
  }

  const newUser: User = {
    id: `user-${uuidv4().slice(0, 8)}`,
    nickname: nickname.trim(),
    avatar: EMOJI_AVATARS[Math.floor(Math.random() * EMOJI_AVATARS.length)],
    signature: '',
    editCount: 0,
    reviewPassRate: 0,
    totalReviews: 0,
    passedReviews: 0,
  };
  db.users.set(newUser.id, newUser);
  res.json({ user: newUser, isNew: true });
});

app.get('/api/users/:id', (req, res) => {
  const user = db.users.get(req.params.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  res.json(user);
});

app.put('/api/users/:id', (req, res) => {
  const user = db.users.get(req.params.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  const { nickname, avatar, signature } = req.body as {
    nickname?: string;
    avatar?: string;
    signature?: string;
  };
  if (nickname !== undefined) user.nickname = nickname;
  if (avatar !== undefined && EMOJI_AVATARS.includes(avatar)) user.avatar = avatar;
  if (signature !== undefined) user.signature = signature;
  db.users.set(user.id, user);
  res.json(user);
});

app.get('/api/users/:id/stats', (req, res) => {
  const user = db.users.get(req.params.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });

  const docs = db.getDocumentsByUser(user.id);
  const reviewedDocs: string[] = [];
  for (const a of db.annotations.values()) {
    if (a.authorId === user.id && !reviewedDocs.includes(a.docId)) {
      reviewedDocs.push(a.docId);
    }
  }
  const participatedDocs = [...new Set([...docs.map((d) => d.id), ...reviewedDocs])];

  res.json({
    totalEditCount: user.editCount,
    reviewPassRate: user.reviewPassRate,
    totalReviews: user.totalReviews,
    passedReviews: user.passedReviews,
    participatedDocCount: participatedDocs.length,
    documents: docs,
  });
});

app.get('/api/documents', (req, res) => {
  res.json(db.getAllDocuments());
});

app.get('/api/documents/user/:userId', (req, res) => {
  res.json(db.getDocumentsByUser(req.params.userId));
});

app.get('/api/documents/:id', (req, res) => {
  const doc = db.documents.get(req.params.id);
  if (!doc) return res.status(404).json({ error: '文档不存在' });
  res.json(doc);
});

app.post('/api/documents', (req, res) => {
  const { title, content, creatorId } = req.body as {
    title: string;
    content?: string;
    creatorId: string;
  };
  if (!title || !creatorId) return res.status(400).json({ error: '缺少必要字段' });

  const user = db.users.get(creatorId);
  if (!user) return res.status(404).json({ error: '创建者不存在' });

  const docId = `doc-${uuidv4().slice(0, 8)}`;
  const now = new Date().toISOString();

  const document: Document = {
    id: docId,
    title,
    content: content || `# ${title}\n\n请在这里开始编写文档...`,
    creatorId,
    creatorName: user.nickname,
    status: 'draft',
    currentVersion: 'v1.0',
    major: 1,
    minor: 0,
    createdAt: now,
    updatedAt: now,
    logConfig: {
      title: `${title} 变更日志`,
      logo: '📄',
      copyright: `© 2026 ${user.nickname} 版权所有`,
    },
  };
  db.documents.set(docId, document);

  const version: Version = {
    id: uuidv4(),
    docId,
    version: 'v1.0',
    major: 1,
    minor: 0,
    content: document.content,
    authorId: creatorId,
    authorName: user.nickname,
    authorAvatar: user.avatar,
    createdAt: now,
    summary: '创建文档',
    isPublished: false,
  };
  db.versions.set(version.id, version);

  user.editCount++;

  res.status(201).json(document);
});

app.put('/api/documents/:id', (req, res) => {
  const doc = db.documents.get(req.params.id);
  if (!doc) return res.status(404).json({ error: '文档不存在' });

  const { title, content, status, userId, summary, logConfig } = req.body as {
    title?: string;
    content?: string;
    status?: DocStatus;
    userId?: string;
    summary?: string;
    logConfig?: Document['logConfig'];
  };

  const now = new Date().toISOString();

  if (title !== undefined) doc.title = title;
  if (status !== undefined) doc.status = status;
  if (logConfig !== undefined) doc.logConfig = { ...doc.logConfig, ...logConfig };

  if (content !== undefined && content !== doc.content) {
    const user = userId ? db.users.get(userId) : db.users.get(doc.creatorId);
    if (!user) return res.status(404).json({ error: '用户不存在' });

    doc.content = content;
    doc.minor++;
    doc.currentVersion = `v${doc.major}.${doc.minor}`;
    doc.updatedAt = now;
    user.editCount++;

    const version: Version = {
      id: uuidv4(),
      docId: doc.id,
      version: doc.currentVersion,
      major: doc.major,
      minor: doc.minor,
      content,
      authorId: user.id,
      authorName: user.nickname,
      authorAvatar: user.avatar,
      createdAt: now,
      summary: summary?.slice(0, 100) || '内容更新',
      isPublished: false,
    };
    db.versions.set(version.id, version);
  } else {
    doc.updatedAt = now;
  }

  db.documents.set(doc.id, doc);
  res.json(doc);
});

app.post('/api/documents/:id/finalize', (req, res) => {
  const doc = db.documents.get(req.params.id);
  if (!doc) return res.status(404).json({ error: '文档不存在' });

  const { userId, summary } = req.body as { userId: string; summary?: string };
  const user = db.users.get(userId);
  if (!user) return res.status(404).json({ error: '用户不存在' });

  const now = new Date().toISOString();
  doc.major++;
  doc.minor = 0;
  doc.currentVersion = `v${doc.major}.${doc.minor}`;
  doc.updatedAt = now;
  doc.status = 'published';
  user.editCount++;

  const version: Version = {
    id: uuidv4(),
    docId: doc.id,
    version: doc.currentVersion,
    major: doc.major,
    minor: doc.minor,
    content: doc.content,
    authorId: user.id,
    authorName: user.nickname,
    authorAvatar: user.avatar,
    createdAt: now,
    summary: summary?.slice(0, 100) || `定稿版本 v${doc.currentVersion}`,
    isPublished: true,
  };
  db.versions.set(version.id, version);
  db.documents.set(doc.id, doc);

  res.json({ document: doc, version });
});

app.post('/api/documents/:id/restore', (req, res) => {
  const doc = db.documents.get(req.params.id);
  if (!doc) return res.status(404).json({ error: '文档不存在' });

  const { versionId, userId } = req.body as { versionId: string; userId: string };
  const version = db.versions.get(versionId);
  if (!version || version.docId !== doc.id) {
    return res.status(404).json({ error: '版本不存在' });
  }
  const user = db.users.get(userId);
  if (!user) return res.status(404).json({ error: '用户不存在' });

  const now = new Date().toISOString();
  const oldContent = doc.content;
  doc.content = version.content;
  doc.minor++;
  doc.currentVersion = `v${doc.major}.${doc.minor}`;
  doc.updatedAt = now;
  user.editCount++;

  const newVersion: Version = {
    id: uuidv4(),
    docId: doc.id,
    version: doc.currentVersion,
    major: doc.major,
    minor: doc.minor,
    content: version.content,
    authorId: user.id,
    authorName: user.nickname,
    authorAvatar: user.avatar,
    createdAt: now,
    summary: `恢复到 ${version.version}`,
    isPublished: false,
  };
  db.versions.set(newVersion.id, newVersion);
  db.documents.set(doc.id, doc);

  res.json({ document: doc, version: newVersion, restoredFrom: version, oldContent });
});

app.delete('/api/documents/:id', (req, res) => {
  const doc = db.documents.get(req.params.id);
  if (!doc) return res.status(404).json({ error: '文档不存在' });
  db.documents.delete(req.params.id);
  for (const v of Array.from(db.versions.values())) {
    if (v.docId === req.params.id) db.versions.delete(v.id);
  }
  for (const a of Array.from(db.annotations.values())) {
    if (a.docId === req.params.id) db.annotations.delete(a.id);
  }
  res.json({ success: true });
});

app.get('/api/documents/:id/versions', (req, res) => {
  res.json(db.getVersionsByDocId(req.params.id));
});

app.get('/api/documents/:id/annotations', (req, res) => {
  res.json(db.getAnnotationsByDocId(req.params.id));
});

app.post('/api/documents/:id/annotations', (req, res) => {
  const doc = db.documents.get(req.params.id);
  if (!doc) return res.status(404).json({ error: '文档不存在' });

  const {
    versionId,
    authorId,
    text,
    content,
    startOffset,
    endOffset,
  } = req.body as {
    versionId?: string;
    authorId: string;
    text: string;
    content: string;
    startOffset: number;
    endOffset: number;
  };

  const user = db.users.get(authorId);
  if (!user) return res.status(404).json({ error: '用户不存在' });

  const annotation: Annotation = {
    id: uuidv4(),
    docId: req.params.id,
    versionId: versionId || '',
    authorId,
    authorName: user.nickname,
    authorAvatar: user.avatar,
    signature: user.signature,
    text,
    content,
    startOffset,
    endOffset,
    createdAt: new Date().toISOString(),
    replies: [],
    resolved: false,
  };
  db.annotations.set(annotation.id, annotation);
  res.status(201).json(annotation);
});

app.post('/api/annotations/:id/reply', (req, res) => {
  const annotation = db.annotations.get(req.params.id);
  if (!annotation) return res.status(404).json({ error: '批注不存在' });

  const { authorId, content, approve } = req.body as {
    authorId: string;
    content: string;
    approve?: boolean;
  };

  const user = db.users.get(authorId);
  if (!user) return res.status(404).json({ error: '用户不存在' });

  const reply: AnnotationReply = {
    id: uuidv4(),
    authorId,
    authorName: user.nickname,
    authorAvatar: user.avatar,
    signature: user.signature,
    content,
    createdAt: new Date().toISOString(),
  };
  annotation.replies.push(reply);

  const doc = db.documents.get(annotation.docId);
  if (doc && doc.status === 'pending' && approve !== undefined) {
    user.totalReviews++;
    if (approve) {
      user.passedReviews++;
    }
    user.reviewPassRate = user.totalReviews > 0 ? user.passedReviews / user.totalReviews : 0;
  }

  db.annotations.set(annotation.id, annotation);
  res.json(annotation);
});

app.put('/api/annotations/:id/resolve', (req, res) => {
  const annotation = db.annotations.get(req.params.id);
  if (!annotation) return res.status(404).json({ error: '批注不存在' });
  annotation.resolved = !annotation.resolved;
  db.annotations.set(annotation.id, annotation);
  res.json(annotation);
});

app.get('/api/documents/:id/changelog', (req, res) => {
  const doc = db.documents.get(req.params.id);
  if (!doc) return res.status(404).json({ error: '文档不存在' });

  const versions = db.getVersionsByDocId(req.params.id).filter((v) => v.isPublished || v.minor === 0);
  const allAnnotations = db.getAnnotationsByDocId(req.params.id);
  const contributorIds = new Set<string>();
  contributorIds.add(doc.creatorId);

  for (const v of db.getVersionsByDocId(req.params.id)) {
    contributorIds.add(v.authorId);
  }
  for (const a of allAnnotations) {
    contributorIds.add(a.authorId);
    for (const r of a.replies) contributorIds.add(r.authorId);
  }

  const contributors = Array.from(contributorIds)
    .map((id) => db.users.get(id))
    .filter((u): u is User => !!u)
    .map((u) => ({
      id: u.id,
      name: u.nickname,
      avatar: u.avatar,
      color: getColor(u.nickname),
    }));

  const logs = versions.map((v) => {
    const vContributorIds = new Set<string>([v.authorId]);
    for (const a of allAnnotations) {
      if (a.createdAt <= v.createdAt) {
        vContributorIds.add(a.authorId);
        for (const r of a.replies) vContributorIds.add(r.authorId);
      }
    }
    return {
      ...v,
      contributorIds: Array.from(vContributorIds),
    };
  });

  res.json({
    document: doc,
    logConfig: doc.logConfig,
    logs,
    contributors,
  });
});

app.get('/api/users', (_req, res) => {
  res.json(Array.from(db.users.values()));
});

app.get('/api/avatars', (_req, res) => {
  res.json(EMOJI_AVATARS);
});

app.listen(PORT, () => {
  console.log(`[server] API server running on http://localhost:${PORT}`);
});
