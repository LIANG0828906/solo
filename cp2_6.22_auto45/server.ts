import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

interface User {
  id: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  color: string;
  cursor?: { line: number; column: number };
  selection?: { start: number; end: number };
  socketId?: string;
}

interface Version {
  id: string;
  documentId: string;
  content: string;
  timestamp: number;
  author: string;
  authorId: string;
  name: string;
  isAuto: boolean;
}

interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  createdBy: string;
  inviteLink: string;
  lockedBy?: string;
  lockExpiresAt?: number;
  users: Map<string, User>;
  versions: Version[];
}

const documents: Map<string, Document> = new Map();
const activeUsers: Map<string, Set<string>> = new Map();

const USER_COLORS = [
  '#FF8C42', '#6BA368', '#5B5F97', '#48ACF0', '#E84A5F',
  '#A8DADC', '#F4A261', '#2A9D8F', '#E76F51', '#264653',
];

const DEFAULT_CONTENT = `欢迎使用团队在线文档编辑器

这是一个支持实时协作的文档编辑器。你可以：
1. 实时编辑文档，查看同事的光标位置
2. 创建版本快照，随时回滚到历史版本
3. 管理团队权限，邀请成员协作

开始编辑吧！`;

function initDocument(id: string, title: string, creatorName: string): Document {
  const creatorId = uuidv4();
  const doc: Document = {
    id,
    title,
    content: DEFAULT_CONTENT,
    createdAt: Date.now(),
    createdBy: creatorId,
    inviteLink: `${uuidv4().slice(0, 8)}`,
    users: new Map(),
    versions: [],
  };

  const adminUser: User = {
    id: creatorId,
    name: creatorName,
    role: 'admin',
    color: USER_COLORS[0],
  };
  doc.users.set(creatorId, adminUser);

  const initialVersion: Version = {
    id: uuidv4(),
    documentId: id,
    content: DEFAULT_CONTENT,
    timestamp: Date.now(),
    author: creatorName,
    authorId: creatorId,
    name: '初始版本',
    isAuto: false,
  };
  doc.versions.push(initialVersion);

  activeUsers.set(id, new Set());
  return doc;
}

const demoDocId = 'demo-doc-001';
documents.set(demoDocId, initDocument(demoDocId, '产品需求文档', '系统管理员'));

setInterval(() => {
  documents.forEach((doc) => {
    if (doc.versions.length === 0) return;
    const lastVersion = doc.versions[doc.versions.length - 1];
    const thirtySecondsAgo = Date.now() - 30000;

    if (lastVersion.timestamp < thirtySecondsAgo && lastVersion.content !== doc.content) {
      const autoVersion: Version = {
        id: uuidv4(),
        documentId: doc.id,
        content: doc.content,
        timestamp: Date.now(),
        author: '系统',
        authorId: 'system',
        name: `自动保存 ${new Date().toLocaleTimeString('zh-CN')}`,
        isAuto: true,
      };
      doc.versions.push(autoVersion);
      console.log(`[AutoSave] Document ${doc.id} auto-version saved`);

      io.to(doc.id).emit('version:created', autoVersion);
    }
  });
}, 5000);

setInterval(() => {
  documents.forEach((doc) => {
    if (doc.lockedBy && doc.lockExpiresAt && Date.now() > doc.lockExpiresAt) {
      const locker = doc.users.get(doc.lockedBy);
      doc.lockedBy = undefined;
      doc.lockExpiresAt = undefined;
      io.to(doc.id).emit('document:unlocked', { userId: doc.lockedBy, userName: locker?.name });
      console.log(`[Lock] Document ${doc.id} lock expired and released`);
    }
  });
}, 1000);

app.get('/api/documents/:id', (req, res) => {
  const doc = documents.get(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: '文档不存在' });
  }
  res.json({
    id: doc.id,
    title: doc.title,
    content: doc.content,
    createdAt: doc.createdAt,
    inviteLink: doc.inviteLink,
    lockedBy: doc.lockedBy,
    lockExpiresAt: doc.lockExpiresAt,
    users: Array.from(doc.users.values()).map((u) => ({
      id: u.id,
      name: u.name,
      role: u.role,
      color: u.color,
    })),
  });
});

app.get('/api/documents/:id/versions', (req, res) => {
  const doc = documents.get(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: '文档不存在' });
  }
  res.json([...doc.versions].reverse());
});

app.get('/api/documents/:id/versions/:versionId', (req, res) => {
  const doc = documents.get(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: '文档不存在' });
  }
  const version = doc.versions.find((v) => v.id === req.params.versionId);
  if (!version) {
    return res.status(404).json({ error: '版本不存在' });
  }
  res.json(version);
});

app.post('/api/documents/:id/versions', (req, res) => {
  const doc = documents.get(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: '文档不存在' });
  }
  const { name, author, authorId } = req.body;

  const user = doc.users.get(authorId);
  if (!user || user.role === 'viewer') {
    return res.status(403).json({ error: '没有创建版本的权限' });
  }

  const version: Version = {
    id: uuidv4(),
    documentId: doc.id,
    content: doc.content,
    timestamp: Date.now(),
    author: author || user.name,
    authorId: authorId,
    name: name || `手动版本 ${new Date().toLocaleString('zh-CN')}`,
    isAuto: false,
  };
  doc.versions.push(version);

  io.to(doc.id).emit('version:created', version);
  res.status(201).json(version);
});

app.post('/api/documents/:id/rollback', (req, res) => {
  const doc = documents.get(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: '文档不存在' });
  }
  const { versionId, userId } = req.body;

  const user = doc.users.get(userId);
  if (!user || user.role === 'viewer') {
    return res.status(403).json({ error: '没有回滚权限' });
  }

  const version = doc.versions.find((v) => v.id === versionId);
  if (!version) {
    return res.status(404).json({ error: '版本不存在' });
  }

  const oldContent = doc.content;
  doc.content = version.content;

  const rollbackVersion: Version = {
    id: uuidv4(),
    documentId: doc.id,
    content: doc.content,
    timestamp: Date.now(),
    author: user.name,
    authorId: userId,
    name: `回滚到: ${version.name}`,
    isAuto: false,
  };
  doc.versions.push(rollbackVersion);

  io.to(doc.id).emit('document:rollback', {
    content: doc.content,
    oldContent,
    versionId,
    versionName: version.name,
    userId,
    userName: user.name,
  });
  io.to(doc.id).emit('version:created', rollbackVersion);

  res.json({ success: true, version: rollbackVersion });
});

app.post('/api/documents/:id/users', (req, res) => {
  const doc = documents.get(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: '文档不存在' });
  }
  const { name, role, inviteLink, inviterId } = req.body;

  if (inviteLink) {
    if (doc.inviteLink !== inviteLink) {
      return res.status(403).json({ error: '邀请链接无效' });
    }
  } else {
    const inviter = doc.users.get(inviterId);
    if (!inviter || inviter.role !== 'admin') {
      return res.status(403).json({ error: '只有管理员可以邀请用户' });
    }
  }

  const usedColors = Array.from(doc.users.values()).map((u) => u.color);
  const availableColor = USER_COLORS.find((c) => !usedColors.includes(c)) || USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];

  const userId = uuidv4();
  const newUser: User = {
    id: userId,
    name,
    role: role || 'viewer',
    color: availableColor,
  };
  doc.users.set(userId, newUser);

  io.to(doc.id).emit('user:joined', {
    id: userId,
    name: newUser.name,
    role: newUser.role,
    color: newUser.color,
  });

  res.status(201).json({
    id: userId,
    name: newUser.name,
    role: newUser.role,
    color: newUser.color,
  });
});

app.put('/api/documents/:id/users/:userId/role', (req, res) => {
  const doc = documents.get(req.params.id);
  if (!doc) {
    return res.status(404).json({ error: '文档不存在' });
  }
  const { role, adminId } = req.body;

  const admin = doc.users.get(adminId);
  if (!admin || admin.role !== 'admin') {
    return res.status(403).json({ error: '只有管理员可以修改角色' });
  }

  const targetUser = doc.users.get(req.params.userId);
  if (!targetUser) {
    return res.status(404).json({ error: '用户不存在' });
  }

  targetUser.role = role;
  io.to(doc.id).emit('user:roleChanged', {
    userId: req.params.userId,
    role,
    changedBy: admin.name,
  });

  res.json({ success: true });
});

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  socket.on('document:join', ({ documentId, userId, userName, role }) => {
    const doc = documents.get(documentId);
    if (!doc) {
      socket.emit('error', { message: '文档不存在' });
      return;
    }

    const docUsers = activeUsers.get(documentId) || new Set();
    if (docUsers.size >= 10) {
      socket.emit('error', { message: '文档同时编辑用户数已达上限（10人）' });
      return;
    }

    let user = doc.users.get(userId);
    if (!user) {
      const usedColors = Array.from(doc.users.values()).map((u) => u.color);
      const availableColor = USER_COLORS.find((c) => !usedColors.includes(c)) || USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
      user = {
        id: userId,
        name: userName,
        role: role || 'viewer',
        color: availableColor,
        socketId: socket.id,
      };
      doc.users.set(userId, user);
    } else {
      user.socketId = socket.id;
    }

    socket.join(documentId);
    docUsers.add(userId);
    activeUsers.set(documentId, docUsers);

    socket.emit('document:joined', {
      document: {
        id: doc.id,
        title: doc.title,
        content: doc.content,
        lockedBy: doc.lockedBy,
        lockExpiresAt: doc.lockExpiresAt,
      },
      currentUser: {
        id: user.id,
        name: user.name,
        role: user.role,
        color: user.color,
      },
      users: Array.from(docUsers).map((uid) => {
        const u = doc.users.get(uid);
        return u ? { id: u.id, name: u.name, role: u.role, color: u.color, cursor: u.cursor, selection: u.selection } : null;
      }).filter(Boolean),
    });

    socket.to(documentId).emit('user:online', {
      id: user.id,
      name: user.name,
      role: user.role,
      color: user.color,
    });

    console.log(`[Socket] User ${userName} joined document ${documentId}. Active: ${docUsers.size}`);
  });

  socket.on('document:edit', ({ documentId, userId, content, changes }) => {
    const doc = documents.get(documentId);
    if (!doc) return;

    const user = doc.users.get(userId);
    if (!user || user.role === 'viewer') return;

    if (doc.lockedBy && doc.lockedBy !== userId) {
      socket.emit('document:lockDenied', { lockedBy: doc.lockedBy });
      return;
    }

    if (changes && changes.length > 0) {
      const conflict = checkConflict(doc, content, changes);
      if (conflict) {
        socket.emit('document:conflict', {
          serverContent: doc.content,
          userContent: content,
          mergedContent: mergeContent(doc.content, content),
        });
        return;
      }
    }

    doc.content = content;

    socket.to(documentId).emit('document:updated', {
      content,
      changes,
      userId,
      userName: user.name,
    });
  });

  socket.on('cursor:update', ({ documentId, userId, cursor, selection }) => {
    const doc = documents.get(documentId);
    if (!doc) return;

    const user = doc.users.get(userId);
    if (!user) return;

    user.cursor = cursor;
    user.selection = selection;

    socket.to(documentId).emit('cursor:updated', {
      userId,
      cursor,
      selection,
      color: user.color,
      name: user.name,
    });
  });

  socket.on('document:lock', ({ documentId, userId }) => {
    const doc = documents.get(documentId);
    if (!doc) return;

    const user = doc.users.get(userId);
    if (!user || user.role === 'viewer') return;

    if (doc.lockedBy && doc.lockedBy !== userId) {
      const locker = doc.users.get(doc.lockedBy);
      socket.emit('document:lockDenied', {
        lockedBy: doc.lockedBy,
        lockedByName: locker?.name,
        lockExpiresAt: doc.lockExpiresAt,
      });
      return;
    }

    doc.lockedBy = userId;
    doc.lockExpiresAt = Date.now() + 30000;

    io.to(documentId).emit('document:locked', {
      userId,
      userName: user.name,
      lockExpiresAt: doc.lockExpiresAt,
    });

    console.log(`[Lock] Document ${documentId} locked by ${user.name}`);
  });

  socket.on('document:unlock', ({ documentId, userId }) => {
    const doc = documents.get(documentId);
    if (!doc) return;

    if (doc.lockedBy === userId) {
      doc.lockedBy = undefined;
      doc.lockExpiresAt = undefined;
      io.to(documentId).emit('document:unlocked', { userId, userName: doc.users.get(userId)?.name });
      console.log(`[Lock] Document ${documentId} unlocked by ${doc.users.get(userId)?.name}`);
    }
  });

  socket.on('document:heartbeat', ({ documentId, userId }) => {
    const doc = documents.get(documentId);
    if (!doc) return;

    if (doc.lockedBy === userId) {
      doc.lockExpiresAt = Date.now() + 30000;
    }
  });

  socket.on('disconnect', () => {
    documents.forEach((doc, docId) => {
      let targetUserId: string | undefined;
      doc.users.forEach((user, uid) => {
        if (user.socketId === socket.id) {
          targetUserId = uid;
        }
      });

      if (targetUserId) {
        const user = doc.users.get(targetUserId);
        const docUsers = activeUsers.get(docId);
        if (docUsers) {
          docUsers.delete(targetUserId);
        }

        if (doc.lockedBy === targetUserId) {
          doc.lockedBy = undefined;
          doc.lockExpiresAt = undefined;
          io.to(docId).emit('document:unlocked', { userId: targetUserId, userName: user?.name });
        }

        io.to(docId).emit('user:offline', {
          userId: targetUserId,
          userName: user?.name,
        });

        console.log(`[Socket] User ${user?.name} left document ${docId}. Active: ${docUsers?.size || 0}`);
      }
    });
  });
});

function checkConflict(doc: Document, userContent: string, changes: any[]): boolean {
  return false;
}

function mergeContent(serverContent: string, userContent: string): string {
  return serverContent.length >= userContent.length ? serverContent : userContent;
}

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`[Server] Team Document Editor Server running on port ${PORT}`);
  console.log(`[Server] Demo document ID: ${demoDocId}`);
  console.log(`[Server] Invite link token: ${documents.get(demoDocId)?.inviteLink}`);
});
