import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Comment, Version, User } from '../client/types';

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

interface DocumentState {
  content: string;
  users: Map<string, User>;
  comments: Comment[];
  versions: Version[];
}

const documents = new Map<string, DocumentState>();

const getInitialContent = () => {
  return `# 欢迎使用 CodeCollabDoc

这是一个**实时协作**的 Markdown 文档编辑器。

## 功能特点

- 📝 实时协同编辑
- 💬 评论与 @ 提及
- 📋 版本历史记录
- 🎨 多人光标显示

## 快速开始

1. 选中文本后可以添加评论
2. 点击"保存版本"创建历史记录
3. 在右侧查看版本历史并预览

### 代码示例

\`\`\`javascript
function hello() {
  console.log('Hello, World!');
}
\`\`\`

> 提示：所有更改都会实时同步给其他在线用户

---

*开始编辑你的文档吧！*
`;
};

const getDoc = (docId: string): DocumentState => {
  if (!documents.has(docId)) {
    documents.set(docId, {
      content: getInitialContent(),
      users: new Map(),
      comments: [],
      versions: [
        {
          id: 'version-initial',
          title: '初始版本',
          content: getInitialContent(),
          authorId: 'system',
          authorName: '系统',
          authorColor: '#64748B',
          timestamp: Date.now() - 3600000,
        },
      ],
    });
  }
  return documents.get(docId)!;
};

app.get('/api/documents/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const doc = getDoc(id);
  res.json({
    id,
    content: doc.content,
    comments: doc.comments,
  });
});

app.put('/api/documents/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { content } = req.body;
  const doc = getDoc(id);
  doc.content = content;
  res.json({ success: true, content });
});

app.get('/api/versions', (req: Request, res: Response) => {
  const documentId = req.query.documentId as string;
  const doc = getDoc(documentId || 'doc-1');
  res.json({ versions: doc.versions });
});

app.post('/api/versions', (req: Request, res: Response) => {
  const { documentId, version } = req.body;
  const doc = getDoc(documentId || 'doc-1');
  doc.versions.unshift(version);
  res.json({ success: true, version });
});

app.get('/api/comments', (req: Request, res: Response) => {
  const documentId = req.query.documentId as string;
  const doc = getDoc(documentId || 'doc-1');
  res.json({ comments: doc.comments });
});

app.post('/api/comments', (req: Request, res: Response) => {
  const { documentId, comment } = req.body;
  const doc = getDoc(documentId || 'doc-1');
  doc.comments.unshift(comment);
  res.json({ success: true, comment });
});

interface JoinDocumentData {
  documentId: string;
  userId: string;
  userName: string;
  userColor: string;
}

interface ContentChangeData {
  documentId: string;
  content: string;
}

interface CursorChangeData {
  documentId: string;
  top: number;
  left: number;
}

interface CommentData {
  documentId: string;
  comment: Comment;
}

interface VersionData {
  documentId: string;
  version: Version;
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  let currentDocId: string | null = null;
  let currentUserId: string | null = null;

  socket.on('join-document', (data: JoinDocumentData) => {
    const { documentId, userId, userName, userColor } = data;
    currentDocId = documentId;
    currentUserId = userId;

    const doc = getDoc(documentId);

    const user: User = {
      id: userId,
      name: userName,
      color: userColor,
      avatar: userName[0],
    };

    doc.users.set(userId, user);

    socket.join(documentId);

    socket.emit('document-content', { content: doc.content });
    socket.emit('comments-list', doc.comments);

    const usersList = Array.from(doc.users.values());
    io.to(documentId).emit('users-online', usersList);

    socket.to(documentId).emit('user-joined', user);

    console.log(`User ${userName} joined document ${documentId}`);
  });

  socket.on('content-change', (data: ContentChangeData) => {
    const { documentId, content } = data;
    const doc = getDoc(documentId);
    doc.content = content;

    socket.to(documentId).emit('content-update', {
      content,
      userId: currentUserId,
    });
  });

  socket.on('cursor-change', (data: CursorChangeData) => {
    const { documentId, top, left } = data;
    if (!currentUserId) return;

    socket.to(documentId).emit('cursor-update', {
      userId: currentUserId,
      top,
      left,
    });
  });

  socket.on('add-comment', (data: CommentData) => {
    const { documentId, comment } = data;
    const doc = getDoc(documentId);
    doc.comments.unshift(comment);

    io.to(documentId).emit('comment-added', comment);
  });

  socket.on('create-version', (data: VersionData) => {
    const { documentId, version } = data;
    const doc = getDoc(documentId);
    doc.versions.unshift(version);

    io.to(documentId).emit('version-created', version);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    if (currentDocId && currentUserId) {
      const doc = getDoc(currentDocId);
      doc.users.delete(currentUserId);

      socket.to(currentDocId).emit('user-left', currentUserId);

      const usersList = Array.from(doc.users.values());
      io.to(currentDocId).emit('users-online', usersList);
    }
  });
});

const PORT = process.env.PORT || 3010;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready`);
});
