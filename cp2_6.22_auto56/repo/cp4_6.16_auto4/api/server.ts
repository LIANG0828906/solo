import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
  },
});

interface DocDocument {
  id: string;
  title: string;
  content: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

interface OnlineUser {
  userId: string;
  nickname: string;
  color: string;
  cursor?: { index: number; length: number };
  socketId: string;
}

interface VersionSnapshot {
  id: string;
  docId: string;
  content: Record<string, unknown>;
  createdAt: number;
}

const USER_COLORS = [
  '#e74c3c', '#3498db', '#9b59b6', '#f39c12',
  '#1abc9c', '#e67e22', '#2ecc71', '#e91e63',
];

const documents = new Map<string, DocDocument>();
const versions = new Map<string, VersionSnapshot[]>();
const onlineUsers = new Map<string, OnlineUser>();
const userCurrentDoc = new Map<string, string>();

const defaultDoc: DocDocument = {
  id: 'welcome-doc',
  title: '欢迎使用 QuickDoc',
  content: {
    ops: [
      { insert: '欢迎使用 QuickDoc！\n', attributes: { bold: true, header: 1 } },
      { insert: '\n这是一个轻量级的在线文档协作平台，支持多人实时编辑。\n' },
      { insert: '\n功能特点\n', attributes: { bold: true, header: 2 } },
      { insert: '\n实时协作：多人同时编辑，内容即时同步\n' },
      { insert: '光标显示：查看其他用户的编辑位置\n' },
      { insert: '版本历史：自动保存，随时回滚\n' },
      { insert: '导出功能：一键导出为 Markdown 文件\n' },
      { insert: '\n开始编辑吧！ 🎉\n', attributes: { italic: true } },
    ],
  },
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

documents.set(defaultDoc.id, defaultDoc);
versions.set(defaultDoc.id, []);

function saveVersion(docId: string) {
  const doc = documents.get(docId);
  if (!doc) return;

  const snapshot: VersionSnapshot = {
    id: uuidv4(),
    docId,
    content: JSON.parse(JSON.stringify(doc.content)),
    createdAt: Date.now(),
  };

  const docVersions = versions.get(docId) || [];
  docVersions.push(snapshot);
  if (docVersions.length > 50) {
    docVersions.shift();
  }
  versions.set(docId, docVersions);

  io.to(`doc:${docId}`).emit('version-saved', { docId, version: snapshot });
}

setInterval(() => {
  documents.forEach((_, docId) => {
    const usersInDoc = Array.from(userCurrentDoc.entries()).filter(([, d]) => d === docId);
    if (usersInDoc.length > 0) {
      saveVersion(docId);
    }
  });
}, 5 * 60 * 1000);

io.on('connection', (socket) => {
  const userId = socket.id;
  console.log(`User connected: ${userId}`);

  socket.on('set-nickname', (data: { nickname: string }) => {
    const colorIndex = onlineUsers.size % USER_COLORS.length;
    const user: OnlineUser = {
      userId,
      nickname: data.nickname,
      color: USER_COLORS[colorIndex],
      socketId: socket.id,
    };
    onlineUsers.set(userId, user);

    const docs = Array.from(documents.values()).sort((a, b) => b.updatedAt - a.updatedAt);
    socket.emit('document-list', docs);

    socket.broadcast.emit('user-joined', {
      userId,
      nickname: user.nickname,
      color: user.color,
    });

    const users = Array.from(onlineUsers.values()).map((u) => ({
      userId: u.userId,
      nickname: u.nickname,
      color: u.color,
      cursor: u.cursor,
    }));
    io.emit('online-users', users);
  });

  socket.on('join-document', (data: { docId: string }) => {
    const prevDoc = userCurrentDoc.get(userId);
    if (prevDoc) {
      socket.leave(`doc:${prevDoc}`);
    }

    userCurrentDoc.set(userId, data.docId);
    socket.join(`doc:${data.docId}`);

    const doc = documents.get(data.docId);
    if (doc) {
      socket.emit('document-content', { docId: data.docId, content: doc.content });
    }

    const docVersions = versions.get(data.docId) || [];

    if (docVersions.length === 0 && doc) {
      saveVersion(data.docId);
    }

    const refreshedVersions = versions.get(data.docId) || [];
    socket.emit('version-list', { docId: data.docId, versions: refreshedVersions });
  });

  socket.on('leave-document', (data: { docId: string }) => {
    socket.leave(`doc:${data.docId}`);
    userCurrentDoc.delete(userId);

    const user = onlineUsers.get(userId);
    if (user) {
      user.cursor = undefined;
    }
  });

  socket.on('delta', (data: { docId: string; delta: Record<string, unknown> }) => {
    const doc = documents.get(data.docId);
    if (doc) {
      doc.updatedAt = Date.now();
    }
    socket.to(`doc:${data.docId}`).emit('delta', {
      docId: data.docId,
      delta: data.delta,
      userId,
    });
  });

  socket.on('cursor', (data: { docId: string; cursor: { index: number; length: number } }) => {
    const user = onlineUsers.get(userId);
    if (user) {
      user.cursor = data.cursor;
    }
    socket.to(`doc:${data.docId}`).emit('cursor', {
      docId: data.docId,
      cursor: data.cursor,
      userId,
    });

    const users = Array.from(onlineUsers.values()).map((u) => ({
      userId: u.userId,
      nickname: u.nickname,
      color: u.color,
      cursor: u.cursor,
    }));
    io.to(`doc:${data.docId}`).emit('online-users', users);
  });

  socket.on('create-document', (data: { title: string }) => {
    const newDoc: DocDocument = {
      id: uuidv4(),
      title: data.title,
      content: { ops: [{ insert: '\n' }] },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    documents.set(newDoc.id, newDoc);
    versions.set(newDoc.id, []);

    const docs = Array.from(documents.values()).sort((a, b) => b.updatedAt - a.updatedAt);
    io.emit('document-list', docs);
  });

  socket.on('rename-document', (data: { docId: string; title: string }) => {
    const doc = documents.get(data.docId);
    if (doc) {
      doc.title = data.title;
      doc.updatedAt = Date.now();
      const docs = Array.from(documents.values()).sort((a, b) => b.updatedAt - a.updatedAt);
      io.emit('document-list', docs);
    }
  });

  socket.on('delete-document', (data: { docId: string }) => {
    documents.delete(data.docId);
    versions.delete(data.docId);
    const docs = Array.from(documents.values()).sort((a, b) => b.updatedAt - a.updatedAt);
    io.emit('document-list', docs);
  });

  socket.on('rollback-version', (data: { docId: string; versionId: string }) => {
    const doc = documents.get(data.docId);
    const docVersions = versions.get(data.docId) || [];
    const version = docVersions.find((v) => v.id === data.versionId);
    if (doc && version) {
      doc.content = JSON.parse(JSON.stringify(version.content));
      doc.updatedAt = Date.now();
      io.to(`doc:${data.docId}`).emit('document-content', {
        docId: data.docId,
        content: doc.content,
      });
    }
  });

  socket.on('get-versions', (data: { docId: string }) => {
    const docVersions = versions.get(data.docId) || [];
    socket.emit('version-list', {
      docId: data.docId,
      versions: docVersions,
    });
  });

  socket.on('save-version', (data: { docId: string }) => {
    const doc = documents.get(data.docId);
    if (!doc) return;

    const docVersions = versions.get(data.docId) || [];
    const lastVersion = docVersions[docVersions.length - 1];

    if (lastVersion && Date.now() - lastVersion.createdAt < 10 * 1000) {
      return;
    }

    saveVersion(data.docId);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${userId}`);
    onlineUsers.delete(userId);
    userCurrentDoc.delete(userId);

    socket.broadcast.emit('user-left', { userId });

    const users = Array.from(onlineUsers.values()).map((u) => ({
      userId: u.userId,
      nickname: u.nickname,
      color: u.color,
      cursor: u.cursor,
    }));
    io.emit('online-users', users);
  });
});

const PORT = 3001;

app.get('/api/versions/:docId', (req, res) => {
  const docId = req.params.docId;
  const docVersions = versions.get(docId) || [];
  res.json({
    success: true,
    docId,
    versions: docVersions.sort((a, b) => b.createdAt - a.createdAt),
  });
});

app.post('/api/rollback/:docId/:versionId', (req, res) => {
  const docId = req.params.docId;
  const versionId = req.params.versionId;
  const doc = documents.get(docId);
  const docVersions = versions.get(docId) || [];
  const version = docVersions.find((v) => v.id === versionId);

  if (!doc || !version) {
    res.status(404).json({ success: false, error: 'Document or version not found' });
    return;
  }

  doc.content = JSON.parse(JSON.stringify(version.content));
  doc.updatedAt = Date.now();
  io.to(`doc:${docId}`).emit('document-content', {
    docId,
    content: doc.content,
  });

  res.json({ success: true });
});

httpServer.listen(PORT, () => {
  console.log(`QuickDoc server running on port ${PORT}`);
});
